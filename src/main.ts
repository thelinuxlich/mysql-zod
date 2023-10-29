/* eslint-disable no-case-declarations */

import path from 'node:path'
import camelCase from 'camelcase'
import fs from 'fs-extra'
import knex from 'knex'

function getType(
	descType: Desc['Type'],
	descField: Desc['Field'],
	descDefault: Desc['Default'],
	descExtra: Desc['Extra'],
	descNull: Desc['Null'],
	config: Config,
) {
	const isNullish = config.nullish && config.nullish === true
	const hasDefaultValue = descDefault !== null
	const isGenerated = descExtra.includes('DEFAULT_GENERATED')
	const isRequiredString =
		config.requiredString && config.requiredString === true
	const isUseDateType = config.useDateType && config.useDateType === true
	const type = descType.split('(')[0].split(' ')[0]
	const isNull = descNull === 'YES'
	const zDate = ['z.coerce.string().pipe(z.coerce.date())']
	const string = ['z.string()']
	const number = ['z.number()']
	const boolean = ['z.boolean()']
	const nullable = isNullish ? 'nullish()' : 'nullable()'
	const optional = 'optional()'
	const nonnegative = 'nonnegative()'
	const min1 = 'min(1)'
	switch (type) {
		case 'date':
		case 'datetime':
		case 'timestamp':
			const dateField = isUseDateType ? zDate : string
			if (isNull) dateField.push(nullable)
			else if (hasDefaultValue) dateField.push(optional)
			if (hasDefaultValue && !isGenerated)
				dateField.push(`default('${descDefault}')`)
			return dateField.join('.')
		case 'time':
		case 'year':
		case 'char':
		case 'varchar':
			if (isNull) string.push(nullable)
			else if (isRequiredString) string.push(min1)
			else if (hasDefaultValue) string.push(optional)
			if (hasDefaultValue && !isGenerated)
				string.push(`default('${descDefault}')`)
			return string.join('.')
		case 'tinytext':
		case 'text':
		case 'mediumtext':
		case 'longtext':
		case 'json':
		case 'decimal':
			if (isNull) string.push(nullable)
			else if (isRequiredString) string.push(min1)
			else if (hasDefaultValue) string.push(optional)
			if (hasDefaultValue && !isGenerated)
				string.push(`default('${descDefault}')`)
			return string.join('.')
		case 'tinyint':
			if (isNull) boolean.push(nullable)
			else if (hasDefaultValue) boolean.push(optional)
			if (hasDefaultValue && !isGenerated)
				boolean.push(`default(${Boolean(+descDefault)})`)
			return boolean.join('.')
		case 'smallint':
		case 'mediumint':
		case 'int':
		case 'bigint':
		case 'float':
		case 'double':
			const unsigned = descType.endsWith(' unsigned')
			if (unsigned) number.push(nonnegative)

			if (isNull) number.push(nullable)
			else if (hasDefaultValue) number.push(optional)
			if (hasDefaultValue && !isGenerated)
				number.push(`default(${descDefault})`)
			return number.join('.')
		case 'enum':
			const value = descType
				.replace('enum(', '')
				.replace(')', '')
				.replace(/,/g, ', ')
			const field = [`z.enum([${value}])`]
			if (isNull) field.push(nullable)
			else if (hasDefaultValue) field.push(optional)
			if (hasDefaultValue && !isGenerated)
				field.push(`default('${descDefault}')`)
			return field.join('.')
	}
}

export async function generate(config: Config) {
	const db = knex({
		client: 'mysql2',
		connection: {
			host: config.host,
			port: config.port,
			user: config.user,
			password: config.password,
			database: config.database,
			ssl: config.ssl,
		},
	})

	const isCamelCase = config.camelCase && config.camelCase === true

	const t = await db.raw(
		'SELECT table_name as table_name FROM information_schema.tables WHERE table_schema = ?',
		[config.database],
	)
	let tables = t[0]
		.map((row: any) => row.table_name)
		.filter((table: string) => !table.startsWith('knex_'))
		.sort() as Tables

	const includedTables = config.tables
	if (includedTables && includedTables.length)
		tables = tables.filter((table) => includedTables.includes(table))

	const allIgnoredTables = config.ignore
	const ignoredTablesRegex = allIgnoredTables?.filter((ignoreString) => {
		const isPattern = ignoreString.startsWith('/') && ignoreString.endsWith('/')
		return isPattern
	})
	const ignoredTableNames = allIgnoredTables?.filter(
		(table) => !ignoredTablesRegex?.includes(table),
	)

	if (ignoredTableNames && ignoredTableNames.length)
		tables = tables.filter((table) => !ignoredTableNames.includes(table))

	if (ignoredTablesRegex && ignoredTablesRegex.length) {
		tables = tables.filter((table) => {
			let useTable = true
			ignoredTablesRegex.forEach((text) => {
				const pattern = text.substring(1, text.length - 1)
				if (table.match(pattern) !== null) useTable = false
			})
			return useTable
		})
	}

	for (let table of tables) {
		const d = await db.raw(`DESC ${table}`)
		const describes = d[0] as Desc[]
		if (isCamelCase) table = camelCase(table)
		let content = `import z from 'zod'

export const ${table} = z.object({`
		for (const desc of describes) {
			const field = isCamelCase ? camelCase(desc.Field) : desc.Field
			const type = getType(
				desc.Type,
				desc.Field,
				desc.Default,
				desc.Extra,
				desc.Null,
				config,
			)
			content = `${content}
  ${field}: ${type},`
		}
		content = `${content}
})

export type ${camelCase(`${table}Type`)} = z.infer<typeof ${table}>
`
		const dir = config.folder && config.folder !== '' ? config.folder : '.'
		const file =
			config.suffix && config.suffix !== ''
				? `${table}.${config.suffix}.ts`
				: `${table}.ts`
		const dest = path.join(dir, file)
		console.log('Created:', dest)
		fs.outputFileSync(dest, content)
	}
	await db.destroy()
}

type Tables = string[]
interface Desc {
	Field: string
	Default: string | null
	Extra: string
	Type: string
	Null: 'YES' | 'NO'
}
export interface Config {
	host: string
	port: number
	user: string
	password: string
	database: string
	tables?: string[]
	ignore?: string[]
	folder?: string
	suffix?: string
	camelCase?: boolean
	nullish?: boolean
	requiredString?: boolean
	useDateType?: boolean
	ssl?: Record<string, any>
}
