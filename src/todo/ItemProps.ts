import {Photo} from "../core/usePhoto";

export interface ItemProps {
  _id?: string;
  title: string;
  year: string;
  type: string;
  version?: number;
  photo?: Photo;
  latitude?: number,
  longitude?: number,
}
