import React, {useContext, useState} from 'react';
import { createAnimation, IonModal, IonButton, IonContent } from '@ionic/react';
import {ItemContext} from "./ItemProvider";
import {MyMap} from "../core/MyMap";
import {ItemsMap} from "../core/ItemsMap";

export const ItemModal: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const { items, fetching, fetchingError } = useContext(ItemContext);

    function showLocation(source: string) {
        return (e: any) => {
            console.log(source, e.latLng.lat(), e.latLng.lng());
        }
    }

    const enterAnimation = (baseEl: any) => {
        const backdropAnimation = createAnimation()
            .addElement(baseEl.querySelector('ion-backdrop')!)
            .fromTo('opacity', '0.01', 'var(--backdrop-opacity)');

        const wrapperAnimation = createAnimation()
            .addElement(baseEl.querySelector('.modal-wrapper')!)
            .keyframes([
                { offset: 0, opacity: '0', transform: 'scale(0)' },
                { offset: 1, opacity: '0.99', transform: 'scale(1)' }
            ]);

        return createAnimation()
            .addElement(baseEl)
            .easing('ease-out')
            .duration(500)
            .addAnimation([backdropAnimation, wrapperAnimation]);
    }

    const leaveAnimation = (baseEl: any) => {
        return enterAnimation(baseEl).direction('reverse');
    }

    return (
        <>
            <IonModal isOpen={showModal} enterAnimation={enterAnimation} leaveAnimation={leaveAnimation}>
                <p>All movies with location are now on the MAP </p>
                    {
                        items && <ItemsMap
                        items={items}
                        onMapClick = {showLocation('onMap')}
                        onMarkerClick = {showLocation('onMarker')}
                            />
                    }
                <IonButton onClick={() => setShowModal(false)}>Close MAP</IonButton>
            </IonModal>
            <IonButton onClick={() => setShowModal(true)}>Open MAP</IonButton>
        </>
    );
}
