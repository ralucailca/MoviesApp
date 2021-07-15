import React from "react";
import { withScriptjs, withGoogleMap, GoogleMap, Marker } from 'react-google-maps';
import { compose, withProps } from 'recompose';
import { mapsApiKey } from './mapsApiKey';
import {ItemProps} from "../todo/ItemProps";

interface MyMapProps {
    items?:ItemProps[]
    onMapClick: (e: any) => void,
    onMarkerClick: (e: any) => void,
}

export const ItemsMap =
    compose<MyMapProps, any>(
        withProps({
            googleMapURL:
                `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&v=3.exp&libraries=geometry,drawing,places`,
            loadingElement: <div style={{ height: `100%` }} />,
            containerElement: <div style={{ height: `350px` }} />,
            mapElement: <div style={{ height: `100%` }} />
        }),
        withScriptjs,
        withGoogleMap
    )(props => (
        <GoogleMap
            defaultZoom={8}
            defaultCenter={{ lat: 46.770439, lng: 23.591423 }}
            onClick={props.onMapClick}
        >
            {
                props.items?.filter(item => item.longitude && item.longitude).map( item => (
                     <Marker
                            key={item._id}
                            title={item.title}
                            position={{ lat: item.latitude, lng: item.longitude }}
                            onClick={props.onMarkerClick}
                    />
                ))
            }
        </GoogleMap>
    ))
