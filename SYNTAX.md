| Syntax / Feature     | Description                                                                                                  | Example                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| **`term1 term2`**    | **AND Logic (Space):** Matches items containing _all_ space-separated terms across general fields.           | `cat tree`                             |
| **`term1, term2`**   | **OR Logic (Comma):** Matches items containing _any_ of the comma-separated groups.                          | `cat, dog`                             |
| **`!term`**          | **NOT Logic:** Excludes items containing the term.                                                           | `cat !dog`                             |
| **`"exact phrase"`** | **Exact Match:** Retains spaces to search for an exact, unbroken string.                                     | `"blue sky"`                           |
| **`key:value`**      | **Field Search:** Restricts the search to a specific field (`name`, `prompt`, `workflow`, or custom label).  | `name:v1`, `prompt:"blue sky"`         |
| **`index:value`**    | **Index Search:** Restricts the search to a custom configured field by its numeric order (1-based).          | `1:sdxl`, `2:1024`                     |
| **`.` (Prefix)**     | **Force Show Hidden:** Temporarily overrides the hidden folder filter if the entire query starts with a dot. | `.drafts`, `. name:test`               |
| **Combined**         | Syntaxes can be chained to create complex queries.                                                           | `prompt:"blue sky" !name:test, 1:sdxl` |
