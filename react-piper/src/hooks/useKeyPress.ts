import {useCallback, useEffect, useState} from 'react';

type KeyType = KeyboardEvent['key'][];

export const useKeyPress = (keys: KeyType, callback?: () => void): boolean => {
    const [keyPressed, setKeyPressed] = useState(false);

    const downHandler = useCallback(({key}: KeyboardEvent): void => {
            if (keys.includes(key)) {
                setKeyPressed(true);
            }
        },
        [keys],
    );

    const upHandler = useCallback(
        ({key}: KeyboardEvent): void => {
            if (keys.includes(key)) {
                setKeyPressed(false);
                callback && callback();
            }
        },
        [keys, callback],
    );

    useEffect(() => {
        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);

        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    }, [downHandler, upHandler]);

    return keyPressed;
};