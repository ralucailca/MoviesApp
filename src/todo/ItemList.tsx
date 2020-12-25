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
  IonInfiniteScrollContent,
  useIonViewWillEnter,
  IonLabel,
  IonItemDivider
} from '@ionic/react';
import { add, logOut, wifi, cloudUploadOutline } from 'ionicons/icons';
import Item from './Item';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import {AuthContext} from "../auth";
import { ItemProps } from './ItemProps';
import {useNetwork} from '../core';
import { useBackgroundTask } from '../core/useBackgroundTask';
import { Plugins } from '@capacitor/core';
import { useAppState } from '../core/useAppState';
import { getDate } from './ItemLocalStorage';

const log = getLogger('ItemList');

const { BackgroundTask } = Plugins;

const ItemList: React.FC<RouteComponentProps> = ({ history }) => {
  const { networkStatus } = useNetwork();
  const { appState } = useAppState();
  const { items, unsavedItems , fetching, fetchingError, saveItem } = useContext(ItemContext);
  //const [ lastModified, setLastModified] = useState<string|null>(null);
  log('render');
  
  //logout
  const { logout } = useContext(AuthContext);
  const handleLogout = () => {
    logout?.();
    return <Redirect to={{ pathname: "/login" }} />;
  };

  //pagination&filter&search
  const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false); //cat timp se mai poate face scroll pentru paginare
  const [position, setPosition] = useState(4); //afiseaza cate 4 elem din lista pe ecran
  const [itemsShow, setItemsShow] = useState<ItemProps[]>([]); //elementele afisate

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
      setItemsShow([...itemsShow, ...items.slice(position, 3 + position)]);
      setPosition(position + 3);
    } else {
      setDisableInfiniteScroll(true);
    }

    await ($event.target as HTMLIonInfiniteScrollElement).complete();
  }

  useEffect(() => {
    if (items?.length) {
      setItemsShow(items.slice(0, 4));
    }
    console.log("items "+position);
  }, [items]);

  useEffect(()=>{
    setDisableInfiniteScroll(false);
    setPosition(4);
  }, [networkStatus, items]);

  const useBackgroundTask = (asyncTask: () => Promise<void>) => {
     useEffect(() => {
     let taskId = BackgroundTask.beforeExit(async () => {
         console.log('useBackgroundTask - executeTask started');
         if(!appState.isActive && networkStatus.connected && unsavedItems){
           // daca suntem din nou online si avem Items neprocesate creeam un nou background task 
           await asyncTask();
         }
         console.log('useBackgroundTask - executeTask finished');
         BackgroundTask.finish({ taskId });
       });
     }, [networkStatus, appState])
     return {};
   };
  
  useBackgroundTask(() => new Promise(resolve => {
    console.log('My Background Task'+ unsavedItems);
    //apelam api pentru salvare elemente pe server
    unsavedItems && unsavedItems.forEach(item => {
      saveItem && saveItem(item);
    });
    resolve();
  }));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Movies App 
            {
              networkStatus.connected && <IonIcon icon={wifi} style={{color:"green"}} /> 
                                      || <IonIcon icon={wifi} style={{color:"red"}} />
            }
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout}>
              Logout
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={fetching} message="Fetching items" />
        {unsavedItems && (
          <><IonItemDivider>
            <IonLabel>
                Items are not processed
            </IonLabel>
            </IonItemDivider>
            <IonList>
              {unsavedItems.map(({ _id, title, year, version, type }) => 
              <> <IonIcon icon={cloudUploadOutline}/>
                  <Item key={_id} _id={_id} title={title} year={year} type={type} version={version} onEdit={id => console.log(id)} /></>
              )}
            </IonList></>
        )}
        <IonItemDivider>
          <IonLabel>
            Movies
          </IonLabel>
        </IonItemDivider>
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
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/item')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default ItemList;
