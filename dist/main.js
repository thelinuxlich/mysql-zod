import $ from"node:path";import C from"fs-extra";import T from"knex";import b from"camelcase";function w(t,u,l){const f=l.nullish&&l.nullish===!0,s=l.requiredString&&l.requiredString===!0,d=t.split("(")[0].split(" ")[0],i=u==="YES",r=["z.string()"],o=["z.number()"],e=["z.coerce.boolean()"],n=f?"nullish()":"nullable()",c="nonnegative()",a="min(1)";switch(d){case"date":case"datetime":case"timestamp":case"time":case"year":case"char":case"varchar":case"tinytext":case"text":case"mediumtext":case"longtext":case"json":case"decimal":return i?r.push(n):s&&r.push(a),r.join(".");case"tinyint":return i&&e.push(n),e.join(".");case"smallint":case"mediumint":case"int":case"bigint":case"float":case"double":return t.endsWith(" unsigned")&&o.push(c),i&&o.push(n),o.join(".");case"enum":const m=[`z.enum([${t.replace("enum(","").replace(")","").replace(/,/g,", ")}])`];return i&&m.push(n),m.join(".")}}async function N(t){const u=T({client:"mysql2",connection:{host:t.host,port:t.port,user:t.user,password:t.password,database:t.database,ssl:t.ssl??{}}}),l=t.camelCase&&t.camelCase===!0;let s=(await u.raw("SELECT table_name as table_name FROM information_schema.tables WHERE table_schema = ?",[t.database]))[0].map(e=>e.table_name).filter(e=>!e.startsWith("knex_")).sort();const d=t.tables;d&&d.length&&(s=s.filter(e=>d.includes(e)));const i=t.ignore,r=i?.filter(e=>e.startsWith("/")&&e.endsWith("/")),o=i?.filter(e=>!r?.includes(e));o&&o.length&&(s=s.filter(e=>!o.includes(e))),r&&r.length&&(s=s.filter(e=>{let n=!0;return r.forEach(c=>{const a=c.substring(1,c.length-1);e.match(a)!==null&&(n=!1)}),n}));for(let e of s){const c=(await u.raw(`DESC ${e}`))[0];l&&(e=b(e));let a=`import z from 'zod'

export const ${e} = z.object({`;for(const p of c){const y=l?b(p.Field):p.Field,x=w(p.Type,p.Null,t);a=`${a}
  ${y}: ${x},`}a=`${a}
})

export type ${b(`${e}Type`)} = z.infer<typeof ${e}>
`;const h=t.folder&&t.folder!==""?t.folder:".",g=t.suffix&&t.suffix!==""?`${e}.${t.suffix}.ts`:`${e}.ts`,m=$.join(h,g);console.log("Created:",m),C.outputFileSync(m,a)}await u.destroy()}export{N as generate};
