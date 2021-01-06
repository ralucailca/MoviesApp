import React, { useContext, useEffect, useState } from 'react';
import { Redirect, RouteComponentProps } from 'react-router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList, IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/react';
import Item from './Item';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import {AuthContext} from "../auth";
import { ItemProps } from './ItemProps';
import {ItemModal} from "./ItemModal";

const log = getLogger('ItemList');

const ItemList: React.FC<RouteComponentProps> = ({ history }) => {
  const { items, fetching, fetchingError } = useContext(ItemContext);
  log('render');

  //pagination&filter&search
  const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false); //cat timp se mai poate face scroll pentru paginare
  const [filter, setFilter] = useState<string | undefined>("all"); //filtrul ales (genul ales)
  const [criteria, setCriteria] = useState<string[]>(["all", "action", "adventure", "animation", "comedy", "crime", "drama", "historical", "horror", "political", "romance", "SF", "thriller" ]); //filtru dupa gen
  const [searchTitle, setSearchTitle] = useState<string>(""); //titlul pentru care se face cautarea
  const [position, setPosition] = useState(4); //afiseaza cate 4 elem din lista pe ecran
  const [itemsShow, setItemsShow] = useState<ItemProps[]>([]); //elementele afisate

  useEffect(() => {
    if (items?.length) {
      setItemsShow(items.slice(0, 4));
    }
    console.log("items "+position);
  }, [items]);

  useEffect(() => {
    if (filter!="all" && items) {
      setItemsShow(items.filter((item) => item.type == filter).slice(0, 4));
    }
    else if(items){
      setItemsShow(items.slice(0,4))
    }
    setPosition(4);
    setDisableInfiniteScroll(false);
    console.log("filter "+position);
  }, [filter]);

  useEffect(() => {
    if (!searchTitle && items) {
        setItemsShow(items.slice(0, 4));
        setPosition(4);
        setDisableInfiniteScroll(false);
    }
    else if (searchTitle && items) {
      setItemsShow(items.filter((item) => item.title.toLowerCase().includes(searchTitle.toLowerCase())));
    }
    console.log("search "+position);
  }, [searchTitle]);

  function wait(){
    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  async function searchNext($event: CustomEvent<void>) {
    if (items && position < items.length) {
      console.log("NEXT ",position, items.length);
      await wait();
      if(filter=="all"){
        setItemsShow([...itemsShow, ...items.slice(position, 3 + position)]);
      }else{
       setItemsShow([...itemsShow, ...items.filter((item) => item.type == filter).slice(position, 3 + position)]);
      }
      setPosition(position + 3);
    } else {
      setDisableInfiniteScroll(true);
    }

    await ($event.target as HTMLIonInfiniteScrollElement).complete();
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Filter&Search</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={fetching} message="Fetching items" />
        <ItemModal/>
        <IonSelect
            value={filter}
            placeholder="Select type"
            onIonChange={(e) => setFilter(e.detail.value)}
        >
          {criteria.map((option) => (
              <IonSelectOption key={option} value={option}>
                {option}
              </IonSelectOption>
          ))
          }
          <IonSelectOption key={"all"} value={"all"}>{"all"}</IonSelectOption>
        </IonSelect>
        <IonSearchbar
            value={searchTitle}
            debounce={1000}
            onIonChange={(e) => setSearchTitle(e.detail.value!)}
        />
        {itemsShow && itemsShow.map((movie: ItemProps,  i: number) => {
          return (
              <Item
                  key={`${i}`}
                  _id={movie._id}
                  title={movie.title}
                  type={movie.type}
                  year={movie.year}
                  version={movie.version}
                  photo={movie.photo}
                  onEdit={(id) => history.push(`/item/${id}`)}
              />
          );
        })}
        <IonInfiniteScroll
            threshold="100px"
            disabled={disableInfiniteScroll}
            onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}
        >
          <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more movies..."/>
        </IonInfiniteScroll>
        {fetchingError && (
          <div>{fetchingError.message || 'Failed to fetch items'}</div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ItemList;
