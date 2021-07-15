import React, { useContext, useEffect, useState } from 'react';
import { IonImg, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonIcon, IonButton} from '@ionic/react';
import { ItemProps } from './ItemProps';
import { videocam } from 'ionicons/icons';
import { ItemContext } from './ItemProvider';
import { alertCircle } from 'ionicons/icons';
import {basicPhotoAnimation} from "../core/animation";

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

  //useEffect(titleAnimation,[items]);

  function titleAnimation() {
    const title = document.querySelector('.title');
    if(title){
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const animation = basicPhotoAnimation(title);
      animation.play();
    }
  }

  return (
    <IonItem onClick={() => onEdit(_id)}>
      
      <IonCard style={{width:"100%"}}>
          <IonCardHeader>
            <IonCardSubtitle>Movie    <IonIcon icon={videocam} /></IonCardSubtitle>
            <IonCardTitle><strong>Titlu:</strong><span className={'title'}> <em>{title}</em></span></IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <strong> An: </strong> <em>{year}</em> 
            <strong> Gen: </strong> <em>{type}</em>
            <strong> Versiune: </strong> <em>{version}</em>
            {conflict && <IonLabel style={{color: "red"}}>CONFLICT</IonLabel>} 
          </IonCardContent>
          {photo && photo.base64Data && <IonImg src={photo.base64Data} style={{maxWidth: "200px", maxLength:"300px"}}/>}
        </IonCard>
    </IonItem>
  );
};

export default Item;
