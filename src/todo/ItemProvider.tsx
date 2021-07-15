import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { getLogger, useNetwork } from '../core';
import { ItemProps } from './ItemProps';
import { createItem, getItems, newWebSocket, updateItem, deleteItemApi } from './itemApi';
import { AuthContext } from '../auth';
import { Plugins } from '@capacitor/core'
import { addLocalStorageConflict, getLocalStorageConflict, removeLocalStorageConflict,
   saveLocalStorageItems, getLocalStorageItems, getDate, setDate } from './ItemLocalStorage';
import { isReachable } from '../core/isReachable';


const {Storage} = Plugins;
const log = getLogger('ItemProvider');

type SaveItemFn = (item: ItemProps) => Promise<any>;
type DeleteItemFn = (item: ItemProps) => Promise<any>;
type ConflictItemFn = (_id: string) => Promise<string | null>;
type ResolveConflictFn = (_id: string) => any;


export interface ItemsState {
  items?: ItemProps[],
  unsavedItems?: ItemProps[],
  fetching: boolean,
  fetchingError?: Error | null,
  saving: boolean,
  savingError?: Error | null,
  saveItem?: SaveItemFn,
  deleting: boolean,
  deletingError?: Error | null,
  deleteItem?: DeleteItemFn,
  getConflict?: ConflictItemFn,
  resolving: boolean,
  resolvingError?: Error | null, 
  saveChanges?: ResolveConflictFn,
  removeChanges?: ResolveConflictFn,
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: ItemsState = {
  fetching: false,
  saving: false,
  deleting: false,
  resolving: false,
};

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';
const DELETE_ITEM_STARTED = 'DELETE_ITEM_STARTED';
const DELETE_ITEM_SUCCEEDED = 'DELETE_ITEM_SUCCEEDED';
const DELETE_ITEM_FAILED = 'DELETE_ITEM_FAILED';
const FETCH_UNSAVED_ITEMS = 'FETCH_UNSAVED_ITEMS';
const SAVE_ITEM_SERVER = 'SAVE_ITEM_SERVER';
const DELETE_ITEM_SERVER = 'DELETE_ITEM_SERVER';
const RESOLVE_CONFLICT_STARTED = 'RESOLVE_CONFLICT_STARTED';
const RESOLVE_CONFLICT_SUCCEEDED = 'RESOLVE_CONFLICT_SUCCEEDED';
const RESOLVE_CONFLICT_FAILED = 'RESOLVE_CONFLICT_FAILED';

const reducer: (state: ItemsState, action: ActionProps) => ItemsState =
  (state, { type, payload }) => {
    switch (type) {
      case FETCH_ITEMS_STARTED:
        return { ...state, fetching: true, fetchingError: null };
      case FETCH_ITEMS_SUCCEEDED:
        return { ...state, items: payload.items, fetching: false };
      case FETCH_ITEMS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      case SAVE_ITEM_STARTED: {
        return { ...state, savingError: null, saving: true };
      } 
      case SAVE_ITEM_SUCCEEDED:
        return { ...state, saving: false };
      case SAVE_ITEM_FAILED:
        return { ...state, savingError: payload.error, saving: false };
      case DELETE_ITEM_STARTED:
          return { ...state, deletingError: null, deleting: true};
      case DELETE_ITEM_SUCCEEDED:
        return { ...state, deleting: false};
      case DELETE_ITEM_FAILED:
        return { ...state, deletingError: payload.error, deleting:false}
      case FETCH_UNSAVED_ITEMS:
        return { ...state, unsavedItems: payload.unsavedItems }
      case DELETE_ITEM_SERVER: {
        const items = [ ...(state.items || [])];
        const item = payload.item;
        const index = items.findIndex(it => it._id === item._id);
        items.splice(index, 1); //sterge elem din lista din interfata
        (async ()=>{
          await Storage.set({key: "items", value: JSON.stringify(items)});
        })();
        return { ...state, items};
      }
      case SAVE_ITEM_SERVER:{
        console.log("SERVER SAVE "+payload.item);
        const items = [...(state.items || [])];
        const item = payload.item;
        const index = items.findIndex(it => it._id === item._id);
        if (index === -1) {
          items.splice(0, 0, item); //adauga elem. la inceputul listei de pe interfata
        } else {
          items[index] = item;
        }
        (async ()=>{
          await Storage.set({key: "items", value: JSON.stringify(items)});
        })();
        return { ...state, items};
      }
      case RESOLVE_CONFLICT_STARTED:
        return {...state, resolving: true, resolvingError: null};
      case RESOLVE_CONFLICT_SUCCEEDED:
        return {...state, resolving: false, resolvingError: null, savingError: null};
      case RESOLVE_CONFLICT_FAILED:
        return {...state, resolving: false, resolvingError: payload.error};
      default:
        return state;
    }
  };

export const ItemContext = React.createContext<ItemsState>(initialState);

interface ItemProviderProps {
  children: PropTypes.ReactNodeLike,
}

export const ItemProvider: React.FC<ItemProviderProps> = ({ children }) => {
  const { token } = useContext(AuthContext);
  const { networkStatus } = useNetwork();
  const [serverOn, setServerOn]=useState<Boolean>(true);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { items, unsavedItems, fetching, fetchingError, saving, savingError, deleting, deletingError, resolving, resolvingError } = state;
  useEffect(getItemsEffect, [token, networkStatus]);
  useEffect(wsEffect, [token, serverOn, networkStatus]);
  //useEffect(mergeFromServer, [token, networkStatus]);
  const saveItem = useCallback<SaveItemFn>(saveItemCallback, [token]);
  const deleteItem = useCallback<DeleteItemFn>(deleteItemCallback, [token]);
  const getConflict = useCallback<ConflictItemFn>(getConflictCallback, [token]);
  const saveChanges = useCallback<ResolveConflictFn>(saveChangesCallback, [token, items]);
  const removeChanges = useCallback<ResolveConflictFn>(removeChangesCallback, [token, items]);
  const value = { items, unsavedItems , fetching, fetchingError, saving, savingError, 
    saveItem, deleting, deletingError, deleteItem, getConflict, resolving, resolvingError,
    saveChanges, removeChanges };
  log('returns');
  return (
    <ItemContext.Provider value={value}>
      {children}
    </ItemContext.Provider>
  );

  function getItemsEffect() {
    let canceled = false;
    (async ()=>{
      const ret = await Storage.get({key: "unsavedItems"});
      const unsavedItems = JSON.parse(ret.value || '[]');
      if(unsavedItems != []){
        dispatch({ type: FETCH_UNSAVED_ITEMS, payload: { unsavedItems } });
      }
    })();
    fetchItems();
    return () => {
      canceled = true;
    }

    async function fetchItems() {
      if (!token?.trim()) {
        return;
      }
      try {
        log('fetchItems started');
        dispatch({ type: FETCH_ITEMS_STARTED });
        //const items = await getItems(token);
        //await Storage.set({key:"items", value: JSON.stringify(items)});
        //log('fetchItems succeeded');
        let items;
        if(networkStatus.connected){
          items = await getItems(token);
          await Storage.set({key:"items", value: JSON.stringify(items)});
        }else{
           const ret = await Storage.get({key: "items"});
           items = JSON.parse(ret.value || '[]');
        }
        if (!canceled) {
          dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items } });
        }
      } catch (error) {
        log('fetchItems failed');
        console.log('eroare este'+error);
        if(error.message == 'Network Error'){
          setServerOn(false);
          //daca nu avem conexiune luam din local storage 
          const ret = await Storage.get({key: "items"});
          const items = JSON.parse(ret.value || '[]');
          dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items } });
        }else{
          dispatch({ type: FETCH_ITEMS_FAILED, payload: { error } });
        }
      }
    }
  }

  async function saveItemCallback(item: ItemProps) {
    try {
      log('saveItem started');
      dispatch({ type: SAVE_ITEM_STARTED });
      const isOn= await isReachable();
      setServerOn(isOn);
      console.log("SERVER "+isOn);
      let savedItem=null;
      if(networkStatus.connected){
        //daca am coneciune la internet apelez salvare pe server
        savedItem = await (item._id ? updateItem(token, item) : createItem(token, item));
        //setServerOn(false);
        log('saveItem succeeded');
        //daca elementul pentru care a reusit salvarea e pe lista unsavedItems il stergem de pe lista
        if(unsavedItems){
          const index = unsavedItems.findIndex(it => ((it._id && it._id === item._id) || it.title === item.title));
          if(index>=0){
            unsavedItems.splice(index, 1); //sterge elem din lista din interfata
            await Storage.set({key:"unsavedItems", value:JSON.stringify(unsavedItems)});
          }
        }
      }else{
          //daca nu am conexiune adaug in Storage elem. nesalvat
          var index = 0;
          if(unsavedItems){
            index = unsavedItems.findIndex(it => ( it.title===item.title && it.year===item.year && it.type===item.type));
          }
          if(index<0){
            unsavedItems?.splice(0, 0, item); //adaugam in elementele nesalvate
            await Storage.set({key:"unsavedItems", value:JSON.stringify(unsavedItems)});
          }
          savedItem=item;
          dispatch({type: FETCH_UNSAVED_ITEMS, payload: {unsavedItems}});
      }
      
      dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: savedItem } });
    } catch (error) {
      log('saveItem failed');
      if(error.message == 'Network Error'){
        setServerOn(false);
        //daca nu avem conexiune adaugam in local storage elementele nesalvate
        var index = 0;
        if(unsavedItems){
          index = unsavedItems.findIndex(it => ( it.title===item.title && it.year===item.year && it.type===item.type));
        }
        if(index<0){
          unsavedItems?.splice(0, 0, item); //adaugam in elementele nesalvate
          await Storage.set({key:"unsavedItems", value:JSON.stringify(unsavedItems)});
        }
        dispatch({type: FETCH_UNSAVED_ITEMS, payload: {unsavedItems}});
      }
      if(error.response && error.response.status == 409){
        console.log("CONFLICT");
        let conflictItem = error.response.data;
        await addConflict(item);
        //cand e offline nu primeste update-ul de pe server si atunci trebuie updatat astfel
        console.log( conflictItem);
        dispatch({type: SAVE_ITEM_SERVER, payload: { item: conflictItem }});
      }
      dispatch({ type: SAVE_ITEM_FAILED, payload: { error } });
    }
  }

  async function deleteItemCallback(item: ItemProps) {
      try{
        log('deleteItem stared');
        dispatch({type: DELETE_ITEM_STARTED});
        const isOn= await isReachable();
        setServerOn(isOn);
        const deleteItem = await deleteItemApi(token, item);
        log('deleteItemSucced');
        dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {item: item}});
      }catch(error){
        log('deleteing failed');
        setServerOn(false);
        dispatch({type: DELETE_ITEM_FAILED, payload: {error}});
      }
  }

  async function getConflictCallback(_id: string){
    try {
      const conflicted = await getConflictItems(_id);
      return conflicted;
    } catch (error) {
      console.log("ERROR CONFLICT " + error);
      return null;
    }
  }

  async function addConflict(item: ItemProps){
    await addLocalStorageConflict(item);
  }

  async function getConflictItems(_id: string){
    const result = await getLocalStorageConflict(_id);
    return result;
  }

  async function saveChangesCallback(_id: string){
    try{
      dispatch({type: RESOLVE_CONFLICT_STARTED});
      let conflictedStr = await getConflict(_id); //elementul conflictual actual
      if(items && conflictedStr){
        let actual;
        let conflicted = JSON.parse(conflictedStr);
        const index = items.findIndex(it => ((it._id && it._id === _id)));
        if(index>=0){
          actual = items[index];
          conflicted.version = actual.version;
          const savedItem = await updateItem(token, conflicted);
          //await deleteUnsavedItem(_id);
          if(unsavedItems){
            const index = unsavedItems.findIndex(it => it._id === _id);
            if(index>=0){
              unsavedItems.splice(index, 1); //sterge elem din lista din interfata
              await Storage.set({key:"unsavedItems", value:JSON.stringify(unsavedItems)});
            }
          }
          await removeLocalStorageConflict(_id);
          dispatch({type: RESOLVE_CONFLICT_SUCCEEDED});
          return;
        }
      }
      dispatch({type: RESOLVE_CONFLICT_FAILED, payload: {"error": "conflict already resolved"}});
    }catch (error) {
      console.log("CONFLICT " + error);
      dispatch({type: RESOLVE_CONFLICT_FAILED, payload: {error}});
    }
  }

  async function removeChangesCallback(_id: string){
    try {
      dispatch({type: RESOLVE_CONFLICT_STARTED});
      await removeLocalStorageConflict(_id);
      //await deleteUnsavedItem(_id);
      if(unsavedItems){
        const index = unsavedItems.findIndex(it => it._id === _id);
        if(index>=0){
          unsavedItems.splice(index, 1); //sterge elem din lista din interfata
          await Storage.set({key:"unsavedItems", value:JSON.stringify(unsavedItems)});
        }
      }
      dispatch({type: RESOLVE_CONFLICT_SUCCEEDED});
    } catch (error) {
      console.log("CONFLICT " + error);
      dispatch({type: RESOLVE_CONFLICT_FAILED, payload: {error}});
    }
  }

  async function deleteUnsavedItem(_id: string){
    if(unsavedItems){
      const index = unsavedItems.findIndex(it => it._id === _id);
      if(index>=0){
        unsavedItems.splice(index, 1); //sterge elem din lista din interfata
        await Storage.set({key:"unsavedItems", value:JSON.stringify(unsavedItems)});
      }
    }
  }

  function wsEffect() {
    if(serverOn && networkStatus.connected){
      let canceled = false;
      log('wsEffect - connecting');
      let closeWebSocket: () => void;
      if (token?.trim()) {
        closeWebSocket = newWebSocket(token, message => {
          if (canceled) {
            return;
          }
          const { type, payload: item } = message;
          log(`ws message, item ${type}`);
          if (type === 'created' || type === 'updated') {
            dispatch({ type: SAVE_ITEM_SERVER, payload: { item } });
          }
          if (type === 'deleted') {
            dispatch({ type: DELETE_ITEM_SERVER, payload: { item } });
          }
        });
      }
      return () => {
        log('wsEffect - disconnecting');
        canceled = true;
        closeWebSocket?.();
      }
    }
  }

  function mergeFromServer(){
    let canceled = false;
    rewriteItems();
    
    async function rewriteItems() {
      if (!token?.trim()) {
        return;
      }
      try {
        log('fetchItems started');
        dispatch({ type: FETCH_ITEMS_STARTED });
        const items = await getItems(token);
        await Storage.set({key:"items", value: JSON.stringify(items)});
        log('fetchItems succeeded');
        if (!canceled) {
          dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items } });
        }
      } catch (error) {
        log('fetchItems failed');
        console.log('eroare este'+error);
        if(error.message == 'Network Error'){
          setServerOn(false);
          //daca nu avem conexiune luam din local storage 
          const ret = await Storage.get({key: "items"});
          const items = JSON.parse(ret.value || '[]');
          dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items } });
        }else{
          dispatch({ type: FETCH_ITEMS_FAILED, payload: { error } });
        }
      }
    }
  }

};
