import MiniSearch, { MatchInfo } 
                  from "minisearch"
import { useRef } from "react"
import { Log }    from "@hauke5/lib/utils"

const log = Log(`useSearch`)


export type SearchResult = DocID & {
   terms:      string[];
   queryTerms: string[];
   score:      number;
   match:      MatchInfo;
}

export type SearchIndex<Entry> = (docs:Entry)=>number 

/** return type for {@link useSearch} */
export type UseSearch<Index, Result> = {
   /** 
    * a function to retrieve search results for a `query` string from the underlying index 
    * if `silent` is `false` or omitted, a search log will be printed to stdout
    */
   find:       (query:string, silent?:boolean) => (SearchResult & Result)[] 
   /** 
    * a function to add a `doc` to an index.
    * Apart from the fields referenced in `indexFields` and `returnFields`, each `doc` must have a unique `id` field.
    */
   index:      (doc:Doc<Index & Result>) => number
   /** 
    * an async function to add a number of `doc[]` to an index.
    * Apart from the fields referenced in `indexFields` and `returnFields`, each `doc` must have a unique `id` field.
    */
   indexAll:   (docs:Doc<Index & Result>[]) => Promise<number>
   /** the number of terms in the index, updated after each call to `index`*/
   count:   () => number
}

export type Result<ReturnFields> = SearchResult & ReturnFields

export type Doc<Entry> = DocID & Entry
export type DocID = {
   id: any;
}


/**
 * provides functionality to create and search an index of structured documents,
 * using [minisearch](https://github.com/lucaong/minisearch) as an in-memory search index.
 * 
 * @param docs a list of 
 * @param indexFields readonly array of fieldnames to index for full-text search. 
 * Each `doc` provided to the `index` function is expected to have these fields
 * @param returnFields readonly array of fieldnames to return with search results.
 * Each `doc` provided to the `index` function is expected to have these fields
 * @returns two functions, `find` and `index`. See {@link UseSearch}
 */
export function useSearch<Index, Result>(indexFields:readonly(keyof Index)[], returnFields:readonly(keyof Result)[]):UseSearch<Index, Result> {
   const miniSearch     = useRef(createMiniSearch(indexFields, returnFields))
   const searchIndex    = useRef({
      find:    (query:string, silent=false) => find<Index, Result>(miniSearch.current, query, silent),
      index:   (doc:Doc<Index & Result>):number => {
         miniSearch.current.add(doc)
         return miniSearch.current.termCount
      },
      indexAll:   async (docs:Doc<Index & Result>[]):Promise<number> => {
         docs.forEach(doc => miniSearch.current.add(doc))
         return miniSearch.current.termCount
      },
      count:   ():number=>miniSearch.current.termCount
   })
   return searchIndex.current
}

function createMiniSearch<Index, Result>(fields:readonly(keyof Index)[], storeFields:readonly(keyof Result)[]) {
   return new MiniSearch<Index&Result>({
      fields:        fields.slice() as string[], 
      storeFields:   storeFields.slice() as string[],
      processTerm:   (term, _fieldName) => term.toLowerCase(),  
   })
}

function find<Index, Result>(miniSearch:MiniSearch<Index&Result>, query:string, silent:boolean):(SearchResult & Result)[] {
   const result = miniSearch.search(query, {fuzzy:0.2})
   if (!silent) log(`find '${query}': ${result.length} results, ${miniSearch.termCount} terms`)
   return result as (SearchResult & Result)[]
}
