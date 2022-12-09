import {useCallback, useEffect, useState} from 'react';

type KeyType = KeyboardEvent['key'] | KeyboardEvent['key'][];

export const useKeyPress = (keys: KeyType, callback?: () => void): boolean => {
    const [keyPressed, setKeyPressed] = useState(false);

    if (keyPressed && callback) {
        callback();
    }

    const downHandler = useCallback(({key}: KeyboardEvent) => {
            if (keys.includes(key)) {
                setKeyPressed(true);
            }
        },
        [keys],
    );

    const upHandler = useCallback(
        ({key}: KeyboardEvent) => {
            if (keys.includes(key)) {
                setKeyPressed(false);
            }
        },
        [keys],
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