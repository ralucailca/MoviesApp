import { baseUrl } from '../core';
const url = `http://${baseUrl}/api`;

export const isAvailable = () => {
    const timeout = new Promise((resolve, reject) => {
        setTimeout(reject, 300, 'Request timed out');
    });

    const request = fetch('https://httpbin.org/delay/5');

    return Promise
        .race([timeout, request])
        .then(response => alert('It worked :)'))
        .catch(error => alert('It timed out :('));
}

export const isReachable = async () =>{
    const timeout = new Promise((resolve, reject) => {
        setTimeout(reject, 5000, 'Request timed out');
    });
    const request = fetch(url);
    try {
        const response = await Promise
            .race([timeout, request]);
        return true;
    }
    catch (error) {
        return false;
    }
}