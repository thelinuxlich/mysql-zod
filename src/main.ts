/* eslint-disable no-case-declarations */

import path from 'node:path'
import camelCase from 'camelcase'
import fs from 'fs-extra'
import knex from 'knex'

function getType(
	op: 'table' | 'insertable' | 'updateable' | 'selectable',
	descType: Desc['Type'],
	descField: Desc['Field'],
	descDefault: Desc['Default'],
	descExtra: Desc['Extra'],
	descNull: Desc['Null'],
	config: Config,
) {
	const isNullish = config.nullish && config.nullish === true
	const hasDefaultValue = descDefault !== null && op !== 'selectable'
	const isGenerated = ['DEFAULT_GENERATED', 'auto_increment'].includes(
		descExtra,
	)
	const isNull = descNull === 'YES'
	if (isGenerated && !isNull && ['insertable', 'updateable'].includes(op))
		return
	const isRequiredString =
		config.requiredString && config.requiredString === true
	const isUseDateType = config.useDateType && config.useDateType === true
	const type = descType.split('(')[0].split(' ')[0]
	const zDate = [
		'z.union([z.number(), z.string(), z.date()]).pipe(z.coerce.date())',
	]
	const string = ['z.string()']
	const number = ['z.number()']
	const boolean = [
		'z.union([z.number(),z.string(),z.boolean()]).pipe(z.coerce.boolean())',
	]
	const nullable = isNullish && op !== 'selectable' ? 'nullish()' : 'nullable()'
	const optional = 'optional()'
	const nonnegative = 'nonnegative()'
	const isUpdateableFormat = op === 'updateable' && !isNull
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
			if (isUpdateableFormat) dateField.push(optional)
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
			if (isUpdateableFormat) string.push(optional)
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
			if (isUpdateableFormat) string.push(optional)
			return string.join('.')
		case 'tinyint':
			if (isNull) boolean.push(nullable)
			else if (hasDefaultValue) boolean.push(optional)
			if (hasDefaultValue && !isGenerated)
				boolean.push(`default(${Boolean(+descDefault)})`)
			if (isUpdateableFormat) boolean.push(optional)
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
			if (isUpdateableFormat) number.push(optional)
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
			if (isUpdateableFormat) field.push(optional)
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
				'table',
				desc.Type,
				desc.Field,
				desc.Default,
				desc.Extra,
				desc.Null,
				config,
			)
			if (type) {
				content = `${content}
	${field}: ${type},`
			}
		}
		content = `${content}
})

export const insertable_${table} = z.object({`
		for (const desc of describes) {
			const field = isCamelCase ? camelCase(desc.Field) : desc.Field
			const type = getType(
				'insertable',
				desc.Type,
				desc.Field,
				desc.Default,
				desc.Extra,
				desc.Null,
				config,
			)
			if (type) {
				content = `${content}
  ${field}: ${type},`
			}
		}
		content = `${content}
})

export const updateable_${table} = z.object({`
		for (const desc of describes) {
			const field = isCamelCase ? camelCase(desc.Field) : desc.Field
			const type = getType(
				'updateable',
				desc.Type,
				desc.Field,
				desc.Default,
				desc.Extra,
				desc.Null,
				config,
			)
			if (type) {
				content = `${content}
  ${field}: ${type},`
			}
		}
		content = `${content}
})

export const selectable_${table} = z.object({`
		for (const desc of describes) {
			const field = isCamelCase ? camelCase(desc.Field) : desc.Field
			const type = getType(
				'selectable',
				desc.Type,
				desc.Field,
				desc.Default,
				desc.Extra,
				desc.Null,
				config,
			)
			if (type) {
				content = `${content}
  ${field}: ${type},`
			}
		}
		content = `${content}
})

export type ${camelCase(`${table}Type`, {
			pascalCase: true,
		})} = z.infer<typeof ${table}>
export type Insertable${camelCase(`${table}Type`, {
			pascalCase: true,
		})} = z.infer<typeof insertable_${table}>
export type Updateable${camelCase(`${table}Type`, {
			pascalCase: true,
		})} = z.infer<typeof updateable_${table}>
export type Selectable${camelCase(`${table}Type`, {
			pascalCase: true,
		})} = z.infer<typeof selectable_${table}>
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
