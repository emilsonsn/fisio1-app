# Arquitetura do frontend

- `core/`: contratos e serviços singleton. Cada integração HTTP pertence ao seu domínio.
- `features/`: páginas e componentes específicos de cada funcionalidade.
- `layout/`: shell autenticado e elementos compartilhados de navegação.
- `shared/`: componentes visuais reutilizáveis sem regras de negócio.

As rotas usam `loadComponent`, portanto cada página é carregada sob demanda. O `App` apenas hospeda o roteador e o feedback global. Estados de formulário, dialogs e polling permanecem no componente responsável pelo respectivo fluxo.
