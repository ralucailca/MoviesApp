import { createAnimation } from '@ionic/react';

export function useShakeAnimation(element: Node | Node[] | NodeList){
    return createAnimation()
        .addElement(element)
        .duration(700)
        .direction('alternate')
        .iterations(4)
        .keyframes([
            { offset: 0, transform:'translate(1px, 1px) rotate(0deg)'},
            { offset: 0.1, transform:'translate(-1px, -2px) rotate(-1deg)'},
            { offset: 0.2, transform:'translate(-3px, 0px) rotate(1deg)'},
            { offset: 0.3, transform:'translate(3px, 2px) rotate(0deg)'},
            { offset: 0.4, transform:'translate(1px, -1px) rotate(1deg)'},
            { offset: 0.5, transform:'translate(-1px, 2px) rotate(-1deg)'},
            { offset: 0.6, transform:'translate(-3px, 1px) rotate(0deg)'},
            { offset: 0.7, transform:'translate(3px, 1px) rotate(-1deg)'},
            { offset: 0.8, transform:'translate(-1px, -1px) rotate(1deg)'},
            { offset: 0.9, transform:'translate(1px, 2px) rotate(0deg)'},
            { offset: 1, transform:'translate(1px, -2px) rotate(-1deg)'}
        ]);
}

export function useErrorAnimation(element: Node | Node[] | NodeList){
        return createAnimation()
            .addElement(element)
            .duration(3000)
            .fromTo('transform', 'scale(1)', 'scale(1.2)')
            .beforeStyles({
                    'color': 'red'
            });
}

export function useRightAnimation(element: Node | Node[] | NodeList){
    return createAnimation()
        .addElement(element)
        .duration(3000)
        .fromTo('transform', 'scale(1)', 'scale(1.2)')
        .beforeStyles({
            'color': 'green'
        });
}

export function basicPhotoAnimation(element: Node | Node[] | NodeList) {
    return createAnimation()
        .addElement(element)
        .duration(1000)
        .direction('normal')
        .iterations(10)
        .keyframes([
            { offset: 0, transform:'scale(0.3)', opacity: 0},
            { offset: 0.5, transform:'scale(1.05)', opacity: 1},
            { offset: 0.7, transform:'scale(0.9)'},
            { offset: 1, transform:'scale(1)'}
        ]);
}