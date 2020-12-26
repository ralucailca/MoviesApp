import React, { useContext, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonLabel,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItemDivider,
  IonItem,
  IonFab,
  IonFabButton,
  IonIcon,
  IonImg,
  IonActionSheet,
  IonRow,
} from '@ionic/react';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import { RouteComponentProps } from 'react-router';
import { ItemProps } from './ItemProps';
import {usePhotoGallery, Photo} from "../core/usePhoto";
import {camera, trash, close, checkmarkCircleOutline} from "ionicons/icons";
import {useMyLocation} from "../core/useMyLocation";
import {MyMap} from "../core/MyMap";

const log = getLogger('ItemEdit');

interface ItemEditProps extends RouteComponentProps<{
  id?: string;
}> {}

const ItemEdit: React.FC<ItemEditProps> = ({ history, match }) => {
  const { items, saving, savingError, saveItem, deleteItem, getConflict, resolving, resolvingError, saveChanges, removeChanges} = useContext(ItemContext);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState('');
  const [item, setItem] = useState<ItemProps>();
  const [conflict, setConflict] = useState<boolean>(false);
  const [conflictItem, setConflictItem] = useState<ItemProps|null>(null);
  const [photo, setPhoto] = useState<Photo | undefined>();
  const { takePhoto, deletePhoto } = usePhotoGallery();
  const [delPhoto, setDelPhoto] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<number|undefined>();
  const [longitude, setLongitude] = useState<number|undefined>();
  const [newLatitude, setNewLatitude] = useState<number>();
  const [newLongitude, setNewLongitude] = useState<number>();
  const myLocation = useMyLocation();
  const { latitude: lat, longitude: long } = myLocation.position?.coords || {};

  const handleTakePhoto = async() => {
    const id = match.params.id;
    const result = await takePhoto();
    setPhoto(result);
    setDelPhoto(false);
  }

  const handleDeletePhoto = async() => {
    const id = match.params.id;
    await deletePhoto(photo!);
    setPhoto(undefined);
    setDelPhoto(false);
  }
  
  useEffect(() => {
    log('useEffect');
    const routeId = match.params.id || '';
    const item = items?.find(it => it._id === routeId);
    setItem(item);
    if (item) {
      setTitle(item.title);
      setType(item.type);
      setYear(item.year);
      setLatitude(item.latitude);
      setLongitude(item.longitude);
      setPhoto(item.photo);
    }
  }, [match.params.id, items]);


  function resetLatLong(){
    //daca nu avem deja locatie setam locatia utilizatorului, altfel dam locatia filmului drept noua locatie
    if(latitude == undefined || longitude == undefined){
      setNewLatitude(lat);
      setNewLongitude(long);
    } else {
      setNewLatitude(latitude);
      setNewLongitude(longitude);
    }
  }

  useEffect(()=>{
    resetLatLong();
  },[lat, long, latitude, longitude]);
  
  useEffect(()=>{
    const id = match.params.id;
    getConflict?.(id!).then( (result) => {
      if(result == null){
        setConflict(false);
        console.log("CONFLICT "+conflict+" "+id+" "+title);
      }
      else{
        setConflict(true);
        setConflictItem(JSON.parse(result));
        console.log("CONFLICT "+conflict+" "+id+" "+title);
      }
    });
  }, [getConflict]);

  const handleSave = () => {
    const editedItem = item ? { ...item, title, year, type, photo, latitude, longitude } : { title, year, type, photo, latitude, longitude };
    saveItem && saveItem(editedItem).then(() => history.goBack());
  };
  
  const handleDelete = () => {
    const editedItem = item ? { ...item, title, year, type, photo, latitude, longitude } : { title, year, type, latitude, longitude };
    deleteItem && deleteItem(editedItem).then(() => history.goBack());
  };

  const handleSaveChanges = () =>{
    const id=match.params.id; 
    saveChanges && saveChanges(id!).then(() => history.goBack());
  };

  const handleRemoveChanges = () =>{
    const id=match.params.id;
    removeChanges && removeChanges(id!).then(() => history.goBack());
  };

  function moveLocation(source: string) {
    return (e: any) => {
      setNewLatitude(e.latLng.lat());
      setNewLongitude(e.latLng.lng());
      console.log(source, e.latLng.lat(), e.latLng.lng());
    }
  }

  log('render');
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Edit</IonTitle>
          <IonButtons slot="end">
            {match.params.id && !conflict && (    //pune butonul de delete doar daca suntem in edit mode - obiectul deja exista, nu si la adaugare si nu cand suntem in conflict mode
            <IonButton onClick={handleDelete} >
              Delete
            </IonButton>
            )} 
            <IonButton onClick={handleSave}>
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItemDivider>Complete the movie data</IonItemDivider>
        <IonItem>
          <IonLabel><strong>Title:</strong></IonLabel>
          <IonInput value={title} onIonChange={e => setTitle(e.detail.value || '')} />
        </IonItem>
        <IonItem>
          <IonLabel><strong>Year:</strong></IonLabel>
          <IonInput value={year} onIonChange={e => setYear(e.detail.value || '')} />
        </IonItem>
        <IonItem>
          <IonLabel><strong>Type:</strong></IonLabel>
          <IonInput value={type} onIonChange={e => setType(e.detail.value || '')} />
        </IonItem>
        <IonItem>
          {photo && photo.base64Data && <IonImg src={photo.base64Data} style={{maxWidth: "200px", maxLength:"300px"}} onClick={()=>setDelPhoto(true)}/>}
          {(!photo || !photo.base64Data) && <IonLabel>Without photo</IonLabel>}
        </IonItem>
        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton onClick={() => handleTakePhoto()}>
            <IonIcon icon={camera}/>
          </IonFabButton>
        </IonFab>
        <IonActionSheet
            isOpen={!!photo && delPhoto}
            buttons={[{
              text: 'Delete',
              role: 'destructive',
              icon: trash,
              handler: () => {
                if (photo && delPhoto) {
                  handleDeletePhoto();
                }
              }
            }, {
              text: 'Cancel',
              icon: close,
              role: 'cancel',
              handler: () => {
                setDelPhoto(false);
              }
            }]}
            onDidDismiss={() => setDelPhoto(false)}
        />

        {
          (!latitude || !longitude) &&
            <IonItem>
              <IonLabel>You are here. Choose the place where the movie is shot.</IonLabel>
            </IonItem>
        }

        {
          (latitude && longitude) &&
          <IonItem>
            <IonLabel>The movie is shot here.</IonLabel>
          </IonItem>
        }

        {
          newLatitude && newLongitude &&
              <MyMap
                  markerTitle = {title}
                  lat = {newLatitude}
                  lng = {newLongitude}
                  onMapClick = {moveLocation('onMap')}
                  onMarkerClick = {moveLocation('onMarker')}
              />
        }

        <IonButton onClick={()=> {setLatitude(newLatitude); setLongitude(newLongitude); console.log(latitude+" "+longitude);}} color={"secondary"}>
          <IonIcon icon={checkmarkCircleOutline}/>
        </IonButton>
        <IonButton onClick={()=> {resetLatLong();}} color={"secondary"}>
          <IonIcon icon={close}/>
        </IonButton>

        <IonRow style={{height: "100px"}}></IonRow>

        {match.params.id && conflict &&
          <IonContent>
            <IonItemDivider>Solve the conflict</IonItemDivider>
            <IonItem>
              <IonLabel style={{color: "red"}}><strong>CONFLICT </strong></IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel><strong>Your conflict version is: </strong></IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel><strong>Title:</strong> {conflictItem?.title}</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel><strong>Year:</strong> {conflictItem?.year}</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel><strong>Type:</strong> {conflictItem?.type}</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel><strong>Version:</strong> {conflictItem?.version}</IonLabel>
            </IonItem>
              <IonButton color="success" onClick={handleSaveChanges} >
                Save my changes
              </IonButton>
              <IonButton color="danger" onClick={handleRemoveChanges}>
                Remove my changes
              </IonButton>
          </IonContent>}

        <IonRow style={{height: "100px"}}></IonRow>

        <IonLoading isOpen={saving} />
        {savingError && (
          <div>{savingError.message || 'Failed to save item'}</div>
        )}

        <IonLoading isOpen={resolving} />
        {resolvingError && (
          <div>{resolvingError.message || 'Failed to resolve item'}</div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ItemEdit;
