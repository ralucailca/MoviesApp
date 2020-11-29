import React from 'react';
import { IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonIcon} from '@ionic/react';
import { ItemProps } from './ItemProps';
import { videocam } from 'ionicons/icons';

interface ItemPropsExt extends ItemProps {
  onEdit: (_id?: string) => void;
}

const Item: React.FC<ItemPropsExt> = ({ _id, title, year, type, onEdit }) => {
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
          </IonCardContent>
        </IonCard>
    </IonItem>
  );
};

export default Item;
