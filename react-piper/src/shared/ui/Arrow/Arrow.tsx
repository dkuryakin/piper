import React, { FC } from 'react';
import { ArrowPosition } from '../../../types';
import style from './Arrow.module.css';
import arrowLeft from '../../assets/images/arrow-left.svg';

interface ArrowProps
    extends React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
    > {
    position: ArrowPosition;
    className?: string;
}

export const Arrow: FC<ArrowProps> = ({ position, className, onClick, ...restProps }) => {
    return (
        <button {...restProps} className={`${style.button} ${className || ''}`} onClick={onClick}>
            <img className={`${style.arrow} ${style[position]}`} src={arrowLeft} alt="Arrow" />
        </button>
    );
};
