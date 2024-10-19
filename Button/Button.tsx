/**
 * ## Buttons
 * Library component for adding standardized buttons.
 * 
 * ### Example
 * ```
 * ```
 * ![Button example](/examples/Button.png)
 * 
 * @module
 */
'use client'
import { DiscreteState }   from "./state";
import { ButtonHTMLAttributes, HTMLAttributes, useState }        from "react";
import styles              from "./Button.module.scss";
// import { Base, BaseProps } from '../Base';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
   /** a callback function that will be called when the user presses a button, along with the index of the button pressed. */
   clicked: (newState: number) => void;
   /** the number of discrete values the state can have; Defaults to `2` */
   numStateValues?: number;
   /** 
    * the initial state of the button. 
    * If both `initialState` and `state` are provided, `state` takes precedence
    */
   initialState?: number;
   /** 
    * an optional `DiscreteState` object that allows the calling component to more directly control the state of the button. 
    * If given, `initialState` is ignored.
    */
   state?: DiscreteState;
}

/**
 * ## Button
 * Creates a stateful buttons that can be pushed. With each press, the button state increases its
 * state value, modulo `numStates`, and informs its calling component of the new state value
 * via the `onSelect` callback.
 *
 * @param props button-group properties
 * @param props.children the button content
 * @param props.onSelect a callback function that will be called when the user presses a button, along with the index of the button pressed
 * @param props.className _optional_ a css class to apply
 * @param props.numStates _optional_ the number of states the button toggles through, defaults to `2`
 * @param props.initialState _optional_ the initial state of the button. 
   If both `initialState` and `state` are provided, `state` takes precedence
 * @param props.state _optional_ `DiscreteState` object that allows the calling component to more directly control the state of the button. 
   If given, `initialState` is ignored.
 */
export function Button({clicked: clicked, initialState, numStateValues, className, children, ...props}: ButtonProps) {
   const [state, setState] = useState(initialState ?? 0);
   const onClick = () => {
      const newState = (state + 1) % (numStateValues ?? 1);
      setState(newState);
      clicked(newState);
   };
   if (props.state) props.state.subscribe((newValue: number) => setState(newValue));

   return <button onClick={onClick} className={`${styles.button} ${className??''} ${styles[`state${state}`]??''}`} {...props}>
      {children}
   </button>
}
