import { Plugins } from '@capacitor/core';
import { ItemProps } from "./ItemProps";

const { Storage } = Plugins;

export const saveLocalStorageItems: (items: ItemProps[]) => Promise<void> = async(items) =>{
    await Storage.set({key:"items", value: JSON.stringify(items)});
    //setDate(new Date(), "items_date");
}

export const setDate: (date: Date, storageKey:string)=>Promise<void> =
    (async(date, storageKey) => {
        await Storage.set({
          key: storageKey,
          value: JSON.stringify(date)
        })
});

export const getDate: (storageKey:string) => Promise<string | null> = async (storageKey) => {
    const d = await Storage.get({ key: storageKey });
    if(d.value !== null){
      return JSON.parse(d.value);
      }
    else {
      return null;
    }
  }



export const getLocalStorageItems: () => Promise<ItemProps[]> = async() =>{
    const ret = await Storage.get({key: "items"});
    const items = JSON.parse(ret.value || '[]');
    return items;
} 

export const addLocalStorageConflict: (item: ItemProps) => Promise<void> = async (item) => {
    await Storage.remove({key: JSON.stringify(item._id)});
    return Storage.set({
       key: JSON.stringify("CONFLICT" + item._id),
       value: JSON.stringify(item)
    });
}

export const removeLocalStorageConflict: (_id: string) => Promise<void> = async (_id) => {
    return Storage.remove({key: JSON.stringify("CONFLICT" + _id)});
}

export const getLocalStorageConflict: (_id: string) => Promise<string | null> = async (_id) => {
    return (await Storage.get({key: JSON.stringify("CONFLICT" + _id)})).value;
}