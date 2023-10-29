import j from"node:path";import f from"camelcase";import C from"fs-extra";import N from"knex";function z(s,h,m,b,p,x,d){const $=d.nullish&&d.nullish===!0,n=b!==null&&s!=="selectable",e=["DEFAULT_GENERATED","auto_increment"].includes(p),r=x==="YES";if(e&&!r&&["selectable"].includes(s))return;const c=d.requiredString&&d.requiredString===!0,l=d.useDateType&&d.useDateType===!0,F=h.split("(")[0].split(" ")[0],E=["z.union([z.number(), z.string(), z.date()]).pipe(z.coerce.date())"],i=["z.string()"],t=["z.number()"],o=["z.boolean()"],a=$&&s!=="selectable"?"nullish()":"nullable()",u="optional()",_="nonnegative()",y=s==="updateable"&&!r,D="min(1)";switch(F){case"date":case"datetime":case"timestamp":const T=l?E:i;return r?T.push(a):n&&T.push(u),n&&!e&&T.push(`default('${b}')`),y&&T.push(u),T.join(".");case"time":case"year":case"char":case"varchar":return r?i.push(a):c?i.push(D):n&&i.push(u),n&&!e&&i.push(`default('${b}')`),y&&i.push(u),i.join(".");case"tinytext":case"text":case"mediumtext":case"longtext":case"json":case"decimal":return r?i.push(a):c?i.push(D):n&&i.push(u),n&&!e&&i.push(`default('${b}')`),y&&i.push(u),i.join(".");case"tinyint":return r?o.push(a):n&&o.push(u),n&&!e&&o.push(`default(${!!+b})`),y&&o.push(u),o.join(".");case"smallint":case"mediumint":case"int":case"bigint":case"float":case"double":return h.endsWith(" unsigned")&&t.push(_),r?t.push(a):n&&t.push(u),n&&!e&&t.push(`default(${b})`),y&&t.push(u),t.join(".");case"enum":const g=[`z.enum([${h.replace("enum(","").replace(")","").replace(/,/g,", ")}])`];return r?g.push(a):n&&g.push(u),n&&!e&&g.push(`default('${b}')`),y&&g.push(u),g.join(".")}}async function U(s){const h=N({client:"mysql2",connection:{host:s.host,port:s.port,user:s.user,password:s.password,database:s.database,ssl:s.ssl}}),m=s.camelCase&&s.camelCase===!0;let p=(await h.raw("SELECT table_name as table_name FROM information_schema.tables WHERE table_schema = ?",[s.database]))[0].map(e=>e.table_name).filter(e=>!e.startsWith("knex_")).sort();const x=s.tables;x&&x.length&&(p=p.filter(e=>x.includes(e)));const d=s.ignore,$=d?.filter(e=>e.startsWith("/")&&e.endsWith("/")),n=d?.filter(e=>!$?.includes(e));n&&n.length&&(p=p.filter(e=>!n.includes(e))),$&&$.length&&(p=p.filter(e=>{let r=!0;return $.forEach(c=>{const l=c.substring(1,c.length-1);e.match(l)!==null&&(r=!1)}),r}));for(let e of p){const c=(await h.raw(`DESC ${e}`))[0];m&&(e=f(e));let l=`import z from 'zod'

export const ${e} = z.object({`;for(const t of c){const o=m?f(t.Field):t.Field,a=z("table",t.Type,t.Field,t.Default,t.Extra,t.Null,s);a&&(l=`${l}
	${o}: ${a},`)}l=`${l}
})

export const insertable_${e} = z.object({`;for(const t of c){const o=m?f(t.Field):t.Field,a=z("insertable",t.Type,t.Field,t.Default,t.Extra,t.Null,s);a&&(l=`${l}
  ${o}: ${a},`)}l=`${l}
})

export const updateable_${e} = z.object({`;for(const t of c){const o=m?f(t.Field):t.Field,a=z("updateable",t.Type,t.Field,t.Default,t.Extra,t.Null,s);a&&(l=`${l}
  ${o}: ${a},`)}l=`${l}
})

export const selectable_${e} = z.object({`;for(const t of c){const o=m?f(t.Field):t.Field,a=z("selectable",t.Type,t.Field,t.Default,t.Extra,t.Null,s);a&&(l=`${l}
  ${o}: ${a},`)}l=`${l}
})

export type ${f(`${e}Type`)} = z.infer<typeof ${e}>
export type Insertable${f(`${e}Type`)} = z.infer<typeof insertable_${e}>
export type Updateable${f(`${e}Type`)} = z.infer<typeof updateable_${e}>
export type Selectable${f(`${e}Type`)} = z.infer<typeof selectable_${e}>
`;const F=s.folder&&s.folder!==""?s.folder:".",E=s.suffix&&s.suffix!==""?`${e}.${s.suffix}.ts`:`${e}.ts`,i=j.join(F,E);console.log("Created:",i),C.outputFileSync(i,l)}await h.destroy()}export{U as generate};
