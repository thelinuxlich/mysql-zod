import R from"node:path";import m from"camelcase";import q from"fs-extra";import W from"knex";function C(s,h,g,$,p,D,u){const x=u.nullish&&u.nullish===!0,l=$!==null&&s!=="selectable",e=["DEFAULT_GENERATED","auto_increment"].includes(p),r=D==="YES";if(e&&!r&&["insertable","updateable"].includes(s))return;const d=u.requiredString&&u.requiredString===!0,a=u.useDateType&&u.useDateType===!0,f=h.split("(")[0].split(" ")[0],_=["z.union([z.number(), z.string(), z.date()]).pipe(z.coerce.date())"],T=["z.string()"],t=["z.number()"],b=["z.union([z.number(),z.string(),z.boolean()]).pipe(z.coerce.boolean())"],i=a?_:T,F=x&&s!=="selectable"?"nullish()":"nullable()",c="optional()",j="nonnegative()",z=s==="updateable"&&!r&&!l,N="min(1)",y=u.overrideTypes?.[f],S=E=>{const n=y?[y]:i;return r?n.push(F):l&&n.push(c),l&&!e&&n.push(`default('${$}')`),z&&n.push(c),n.join(".")},v=E=>{const n=y?[y]:T;return r?n.push(F):d?n.push(N):l&&n.push(c),l&&!e&&n.push(`default('${$}')`),z&&n.push(c),n.join(".")},w=E=>{const n=y?[y]:b;return r?n.push(F):l&&n.push(c),l&&!e&&n.push(`default(${!!+$})`),z&&n.push(c),n.join(".")},k=E=>{const n=h.endsWith(" unsigned"),o=y?[y]:t;return n&&o.push(j),r?o.push(F):l&&o.push(c),l&&!e&&o.push(`default(${$})`),z&&o.push(c),o.join(".")},L=E=>{const o=[`z.enum([${h.replace("enum(","").replace(")","").replace(/,/g,", ")}])`];return r?o.push(F):l&&o.push(c),l&&!e&&o.push(`default('${$}')`),z&&o.push(c),o.join(".")};switch(f){case"date":case"datetime":case"timestamp":return S(f);case"tinytext":case"text":case"mediumtext":case"longtext":case"json":case"decimal":case"time":case"year":case"char":case"varchar":return v(f);case"tinyint":return w(f);case"smallint":case"mediumint":case"int":case"bigint":case"float":case"double":return k(f);case"enum":return L(f)}}async function B(s){const h=W({client:"mysql2",connection:{host:s.host,port:s.port,user:s.user,password:s.password,database:s.database,ssl:s.ssl}}),g=s.camelCase&&s.camelCase===!0;let p=(await h.raw("SELECT table_name as table_name FROM information_schema.tables WHERE table_schema = ?",[s.database]))[0].map(e=>e.table_name).filter(e=>!e.startsWith("knex_")).sort();const D=s.tables;D?.length&&(p=p.filter(e=>D.includes(e)));const u=s.ignore,x=u?.filter(e=>e.startsWith("/")&&e.endsWith("/")),l=u?.filter(e=>!x?.includes(e));l?.length&&(p=p.filter(e=>!l.includes(e))),x?.length&&(p=p.filter(e=>{let r=!0;for(const d of x){const a=d.substring(1,d.length-1);e.match(a)!==null&&(r=!1)}return r}));for(let e of p){const d=(await h.raw(`DESC ${e}`))[0];g&&(e=m(e));let a=`import z from 'zod'

export const ${e} = z.object({`;for(const t of d){const b=g?m(t.Field):t.Field,i=C("table",t.Type,t.Field,t.Default,t.Extra,t.Null,s);i&&(a=`${a}
	${b}: ${i},`)}a=`${a}
})

export const insertable_${e} = z.object({`;for(const t of d){const b=g?m(t.Field):t.Field,i=C("insertable",t.Type,t.Field,t.Default,t.Extra,t.Null,s);i&&(a=`${a}
  ${b}: ${i},`)}a=`${a}
})

export const updateable_${e} = z.object({`;for(const t of d){const b=g?m(t.Field):t.Field,i=C("updateable",t.Type,t.Field,t.Default,t.Extra,t.Null,s);i&&(a=`${a}
  ${b}: ${i},`)}a=`${a}
})

export const selectable_${e} = z.object({`;for(const t of d){const b=g?m(t.Field):t.Field,i=C("selectable",t.Type,t.Field,t.Default,t.Extra,t.Null,s);i&&(a=`${a}
  ${b}: ${i},`)}a=`${a}
})

export type ${m(`${e}Type`,{pascalCase:!0})} = z.infer<typeof ${e}>
export type Insertable${m(`${e}Type`,{pascalCase:!0})} = z.infer<typeof insertable_${e}>
export type Updateable${m(`${e}Type`,{pascalCase:!0})} = z.infer<typeof updateable_${e}>
export type Selectable${m(`${e}Type`,{pascalCase:!0})} = z.infer<typeof selectable_${e}>
`;const f=s.folder&&s.folder!==""?s.folder:".",_=s.suffix&&s.suffix!==""?`${e}.${s.suffix}.ts`:`${e}.ts`,T=R.join(f,_);console.log("Created:",T),q.outputFileSync(T,a)}await h.destroy()}export{B as generate};
