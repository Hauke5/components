import { ChangeEvent, ReactNode, useRef, useState }   
                                 from 'react'
import { mdiCloseCircle, mdiMagnify }            
                                 from '@mdi/js'
import { Icon }                  from '@hauke5/components/Icon'
import { BaseProps }             from '../BaseProps'
import styles                    from './search.module.scss'
import { type useSearch }        from './useSearch'


export type SearchFieldProps<Result> = BaseProps & {
   /** optional (default:undefined) string that, if set, disables the search input and displays the value as a placeholder, e.g. during indexing. */
   disabled?:     string
   /** a callback that produces a list of search results. These will be presented in a pop-down window beneath the search bar. */
   find:          (query:string)=>Result[]
   /** a function that produces the `JSX.Element` for an individual search result */
   resultNode:    (result:Result) => React.JSX.Element
}
/**
 * shows a search field with a popdown to dynamically present search results.
 * A typical usage could look like this:
 * ```
 * function MySearchField() {
 *    const router         = useRouter()
 *    const {find, count}  = useMySearch()   // uses `useSearch` to create an app-specific search
 *    return <SearchField find={find} disabled={count<=0?'indexing...':undefined} resultNode={result => 
 *       <div onClick={()=>router.push(`/path/?query=${result.path}`)} key={result.id}>
 *          {result.title}
 *       </div>
 *    } />
 * } 
 * ```
 * @see {@link useSearch} {@link SearchFieldProps}
 */
export function SearchField<Result>({find, resultNode, disabled, ...props}:SearchFieldProps<Result>) {
   const inputRef             = useRef<HTMLInputElement>(null)
   const [result, setResults] = useState<ReactNode[]>([])
   const placeholder = disabled ?? 'search'
   return <div className={styles.searchField} {...props}>
      <Icon mdi={mdiMagnify} className={styles.magnifyIcon}/>
      <input ref={inputRef} type='search' onChange={change} onFocus={focus} placeholder={placeholder} disabled={!!disabled}/>
      <Icon mdi={mdiCloseCircle} className={styles.clearIcon} onClick={clear}/>
      {result.length>0 && <div className={styles.searchResults} onMouseLeave={closeResults}>{result}</div>}
   </div>

   function focus() {
      inputRef.current?.select()
   }

   function clear() {
      if (inputRef.current) inputRef.current.value = ''
   }
   function change(e:ChangeEvent<HTMLInputElement>) {
      const term = e.target.value.toLowerCase()
      const results = find(term)
      setResults(results.slice(0, 15).map(result => resultNode(result)))
   }

   function closeResults() {
      setResults([])
   }
}

