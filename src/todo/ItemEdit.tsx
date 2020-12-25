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
} from '@ionic/react';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import { RouteComponentProps } from 'react-router';
import { ItemProps } from './ItemProps';
import {usePhotoGallery} from "../core/usePhoto";
import {camera, trash, close} from "ionicons/icons";

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
  const [photo, setPhoto] = useState<string | undefined>();
  const { takePhoto, deletePhoto } = usePhotoGallery();
  const [delPhoto, setDelPhoto] = useState<boolean>(false);

  const handleTakePhoto = async() => {
    const id = match.params.id;
    const result = await takePhoto(id!);
    setPhoto(result);
    setDelPhoto(false);
  }

  const handleDeletePhoto = async() => {
    const id = match.params.id;
    await deletePhoto(photo!, id!);
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
      setPhoto(item.photo);
    }
  }, [match.params.id, items]);
  
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
    const editedItem = item ? { ...item, title, year, type, photo } : { title, year, type };
    saveItem && saveItem(editedItem).then(() => history.goBack());
  };
  
  const handleDelete = () => {
    const editedItem = item ? { ...item, title, year, type, photo } : { title, year, type };
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
          {photo && <IonImg src={photo} style={{maxWidth: "200px", maxLength:"300px"}} onClick={()=>setDelPhoto(true)}/>}
          {!photo && <IonLabel>Without photo</IonLabel>}
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
