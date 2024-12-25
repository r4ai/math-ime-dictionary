import * as path from "@std/path"
import * as fs from "@std/fs"
import * as CSV from "@std/csv"
import * as v from "@valibot/valibot"

const ROOT_DIR = path.resolve(path.join(import.meta.dirname!, ".."))
const DICTIONARY_DIR = path.join(ROOT_DIR, "dictionary")
const DIST_DIR = path.join(ROOT_DIR, "dist")

const dictionary_schema = v.array(
  v.tuple([
    v.pipe(v.string(), v.nonEmpty()), // Word
    v.pipe(v.string(), v.nonEmpty()), // Reading
    v.pipe(v.string(), v.nonEmpty()), // Category
    v.string(), // Comment
  ]),
)

type Dictionary = v.InferInput<typeof dictionary_schema>

export const read_dictionary = async () => {
  const dictionary = new Map<string, Dictionary[number]>()
  for await (const entry of fs.walk(DICTIONARY_DIR)) {
    if (!(entry.isFile && entry.name.endsWith(".csv"))) continue
    const data_raw = await Deno.readTextFile(entry.path)
    const data_csv = CSV.parse(data_raw).slice(1)
    const data = await v.parseAsync(dictionary_schema, data_csv)
    for (const row of data) {
      const key = `${row[0]}__${row[1]}`
      if (dictionary.has(key)) {
        throw new Error(
          `既に登録済みの単語です: ["${row[0]}", "${row[1]}", "${row[2]}", "${
            row[3]
          }"] in ${entry.path}`,
        )
      }
      dictionary.set(key, row)
    }
  }
  return [...dictionary.values()]
}

export const ensure_dist_dir = async () => {
  await fs.ensureDir(DIST_DIR)
}

export const build_microsoft_ime = async (dictionary: Dictionary) => {
  const lines = dictionary.map(([word, reading, category, _]) => {
    return `${word}\t${reading}\t${category}`
  })
  const data = lines.join("\n")
  await Deno.writeTextFile(path.join(DIST_DIR, "microsoft_ime.txt"), data)
}

export const build = async () => {
  const dictionary = await read_dictionary()
  await ensure_dist_dir()
  await build_microsoft_ime(dictionary)
}

if (import.meta.main) {
  build()
}
