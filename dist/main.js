import x from"node:path";import $ from"fs-extra";import C from"knex";import y from"camelcase";function z(t,o,a){const g=a.nullish&&a.nullish===!0,r=a.requiredString&&a.requiredString===!0,c=a.useDateType&&a.useDateType===!0,m=t.split("(")[0].split(" ")[0],n=o==="YES",u=["z.coerce.date()"],e=["z.string()"],l=["z.number()"],i=["z.coerce.boolean()"],s=g?"nullish()":"nullable()",f="nonnegative()",h="min(1)";switch(m){case"date":case"datetime":case"timestamp":const d=c?u:e;return n&&d.push(s),d.join(".");case"time":case"year":case"char":case"varchar":case"tinytext":case"text":case"mediumtext":case"longtext":case"json":case"decimal":return n?e.push(s):r&&e.push(h),e.join(".");case"tinyint":return n&&i.push(s),i.join(".");case"smallint":case"mediumint":case"int":case"bigint":case"float":case"double":return t.endsWith(" unsigned")&&l.push(f),n&&l.push(s),l.join(".");case"enum":const b=[`z.enum([${t.replace("enum(","").replace(")","").replace(/,/g,", ")}])`];return n&&b.push(s),b.join(".")}}async function S(t){const o=C({client:"mysql2",connection:{host:t.host,port:t.port,user:t.user,password:t.password,database:t.database,ssl:t.ssl??{}}}),a=t.camelCase&&t.camelCase===!0;let r=(await o.raw("SELECT table_name as table_name FROM information_schema.tables WHERE table_schema = ?",[t.database]))[0].map(e=>e.table_name).filter(e=>!e.startsWith("knex_")).sort();const c=t.tables;c&&c.length&&(r=r.filter(e=>c.includes(e)));const m=t.ignore,n=m?.filter(e=>e.startsWith("/")&&e.endsWith("/")),u=m?.filter(e=>!n?.includes(e));u&&u.length&&(r=r.filter(e=>!u.includes(e))),n&&n.length&&(r=r.filter(e=>{let l=!0;return n.forEach(i=>{const s=i.substring(1,i.length-1);e.match(s)!==null&&(l=!1)}),l}));for(let e of r){const i=(await o.raw(`DESC ${e}`))[0];a&&(e=y(e));let s=`import z from 'zod'

export const ${e} = z.object({`;for(const p of i){const T=a?y(p.Field):p.Field,b=z(p.Type,p.Null,t);s=`${s}
  ${T}: ${b},`}s=`${s}
})

export type ${y(`${e}Type`)} = z.infer<typeof ${e}>
`;const f=t.folder&&t.folder!==""?t.folder:".",h=t.suffix&&t.suffix!==""?`${e}.${t.suffix}.ts`:`${e}.ts`,d=x.join(f,h);console.log("Created:",d),$.outputFileSync(d,s)}await o.destroy()}export{S as generate};
