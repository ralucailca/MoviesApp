import {useCamera} from '@ionic/react-hooks/camera';
import {CameraResultType, CameraSource, FilesystemDirectory} from '@capacitor/core';
import {useEffect} from 'react';
import {base64FromPath, useFilesystem} from '@ionic/react-hooks/filesystem';

export function usePhotoGallery() {
    const { getPhoto } = useCamera();

    const takePhoto = async (id: string): Promise<string> => {
        const cameraPhoto = await getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        });
        const fileName = new Date().getTime() + '.jpeg';
        //const fileName = id + '.jpeg';
        const base64Data = await base64FromPath(cameraPhoto.webPath!);
        return await savePicture(base64Data, fileName);
    };

    const { deleteFile, readFile, writeFile } = useFilesystem();
    const savePicture = async (base64Data: string, fileName: string): Promise<string> => {
        await writeFile({
            path: fileName,
            data: base64Data,
            directory: FilesystemDirectory.Data
        });
        return base64Data;
    };

    const deletePhoto = async (photo: string, id: string) => {
        if(photo == undefined){
            return;
        }
        //const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
        let filename = id + '.jpeg';
        filename = filename.substr(filename.lastIndexOf('/') + 1);
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
