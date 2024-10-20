import { Token }     from "markdown-it";
import { listItem }  from "../listItem";

export function listIsTight(tokens: Token[], i: number) {
   while (++i < tokens.length) {
      let token = tokens[i];
      if (token && token.type !== `${listItem.specName}_open`) {
         return token.hidden;
      }
   }
   return false;
}
