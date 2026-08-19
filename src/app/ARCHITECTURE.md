# Arquitetura do frontend

- `core/`: contratos e serviços singleton. Cada integração HTTP pertence ao seu domínio.
- `core/models/`: contratos da API separados por entidade; o `index.ts` é somente a fachada pública de exportação.
- `features/`: páginas e componentes específicos de cada funcionalidade.
- `layout/`: shell autenticado e elementos compartilhados de navegação.
- `shared/`: componentes visuais reutilizáveis sem regras de negócio.

O módulo de auditoria permanece isolado em `core/audit-logs/` e `features/audit-logs/`. O backend é a fonte autoritativa dos eventos e das opções de filtro; o frontend apenas consulta e apresenta a trilha imutável.

As rotas usam `loadComponent`, portanto cada página é carregada sob demanda. O `App` apenas hospeda o roteador e o feedback global. Estados de formulário, dialogs e polling permanecem no componente responsável pelo respectivo fluxo.
