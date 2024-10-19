import { ReactNode } from 'react';
import { BaseProps } from '@hauke5/components/BaseProps';
import styles        from './ButtonGroup.module.scss'

export interface ButtonGroupProps extends BaseProps {
   children: ReactNode[]
}

export function ButtonGroup({children, className, ...props}:ButtonGroupProps) {
   return <div className={`${styles.group} ${className??''}`} {...props}>
      {children}
   </div>
}

