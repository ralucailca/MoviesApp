import {useCamera} from '@ionic/react-hooks/camera';
import {CameraPhoto, CameraResultType, CameraSource, FilesystemDirectory} from '@capacitor/core';
import {useEffect} from 'react';
import {base64FromPath, useFilesystem} from '@ionic/react-hooks/filesystem';

export interface Photo {
    filepath: string;
    base64Data?: string;
}

export function usePhotoGallery() {
    const { getPhoto } = useCamera();

    const takePhoto = async (): Promise<Photo> => {
        const cameraPhoto = await getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        });
        const fileName = new Date().getTime() + '.jpeg';
        //const fileName = id + '.jpeg';
        return await savePicture(cameraPhoto, fileName);
    };

    const { deleteFile, readFile, writeFile } = useFilesystem();
    const savePicture = async (photo: CameraPhoto, fileName: string): Promise<Photo> => {
        const base64Data = await base64FromPath(photo.webPath!);
        await writeFile({
            path: fileName,
            data: base64Data,
            directory: FilesystemDirectory.Data
        });
        return {
            filepath: fileName,
            base64Data: base64Data,
        };
    };

    const deletePhoto = async (photo: Photo) => {
        if(photo == undefined){
            return;
        }
        //const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
        const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
        await deleteFile({
            path: filename,
            directory: FilesystemDirectory.Data
        });
    };

    return {
        takePhoto,
        deletePhoto,
    };
}
