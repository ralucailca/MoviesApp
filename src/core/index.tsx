import { ItemProps } from '../todo/ItemProps';

export {default as  useNetwork } from './useNetwork';
//export const baseUrl = 'localhost:3000';
export const baseUrl = '192.168.0.105:3000';


export const getLogger: (tag: string) => (...args: any) => void =
    tag => (...args) => console.log(tag, ...args);

const log = getLogger('api');

export interface ResponseProps<T> {
  data: T;
}

export function withLogs<T>(promise: Promise<ResponseProps<T>>, fnName: string): Promise<T> {
  log(`${fnName} - started`);
  return promise
    .then(res => {
      log(`${fnName} - succeeded`);
      return Promise.resolve(res.data);
    })
    .catch(err => {
      log(`${fnName} - failed`);
      return Promise.reject(err);
    });
}

export const config = {
  headers: {
    'Content-Type': 'application/json'
  }
};

export const authConfig = (token?: string) => ({
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
});

export const authOptimisedConfig = (token?: string, item?:ItemProps) => ({
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'ETag':`${item?.version}`,
  }
});