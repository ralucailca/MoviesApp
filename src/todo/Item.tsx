import React, { useContext, useEffect, useState } from 'react';
import { IonImg, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonIcon, IonButton} from '@ionic/react';
import { ItemProps } from './ItemProps';
import { videocam } from 'ionicons/icons';
import { ItemContext } from './ItemProvider';
import { alertCircle } from 'ionicons/icons';

interface ItemPropsExt extends ItemProps {
  onEdit: (_id?: string) => void;
}
//"data:image/jpeg;base64,"+photo
const Item: React.FC<ItemPropsExt> = ({ _id, title, year, type, version, photo, onEdit }) => {
  const {getConflict, items} = useContext(ItemContext);
  const [conflict, setConflict] = useState<boolean>(false);

  useEffect(() => {
    getConflict?.(_id!).then( (answ) => {
      if(answ == null){
        setConflict(false);
      }
      else{
        setConflict(true);
      }
    });
  }, [ getConflict, items]);

  return (
    <IonItem onClick={() => onEdit(_id)}>
      
      <IonCard style={{width:"100%"}}>
          <IonCardHeader>
            <IonCardSubtitle>Movie    <IonIcon icon={videocam} /></IonCardSubtitle>
            <IonCardTitle><strong>Titlu:</strong> <em>{title}</em></IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <strong> An: </strong> <em>{year}</em> 
            <strong> Gen: </strong> <em>{type}</em>
            <strong> Versiune: </strong> <em>{version}</em>
            {conflict && <IonLabel style={{color: "red"}}>CONFLICT</IonLabel>} 
          </IonCardContent>
          {photo && <IonImg src={photo} style={{maxWidth: "200px", maxLength:"300px"}}/>}
        </IonCard>
    </IonItem>
  );
};

export default Item;
