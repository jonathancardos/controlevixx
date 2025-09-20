# Regras para o Desenvolvimento da Aplicação Vixxe Maria

Este documento descreve a stack tecnológica utilizada no projeto Vixxe Maria e as diretrizes para o uso de bibliotecas, garantindo consistência e boas práticas de desenvolvimento.

## Stack Tecnológica

*   **Framework Frontend**: React.js
*   **Linguagem**: TypeScript
*   **Build Tool**: Vite
*   **Estilização**: Tailwind CSS
*   **Componentes UI**: shadcn/ui (baseado em Radix UI)
*   **Roteamento**: React Router DOM
*   **Gerenciamento de Estado/Dados**: Tanstack Query (para requisições e cache de dados)
*   **Backend as a Service (BaaS)**: Supabase (para banco de dados, autenticação e armazenamento)
*   **Ícones**: Lucide React
*   **Notificações**: Sonner (para toasts)
*   **Manipulação de Datas**: date-fns
*   **Gráficos**: Recharts

## Regras de Uso de Bibliotecas

Para manter a consistência e a eficiência do projeto, siga as seguintes regras ao desenvolver:

*   **UI Components**: Utilize exclusivamente os componentes da biblioteca `shadcn/ui`. Se um componente necessário não existir ou precisar de modificações, crie um novo componente no diretório `src/components/` e estilize-o com Tailwind CSS, em vez de modificar os componentes `shadcn/ui` existentes.
*   **Estilização**: Todas as estilizações devem ser feitas utilizando classes do `Tailwind CSS`. Evite estilos inline ou arquivos CSS personalizados, a menos que seja estritamente necessário para overrides globais (como em `src/index.css`).
*   **Roteamento**: Para navegação entre as páginas, utilize o `React Router DOM`. As rotas principais devem ser mantidas em `src/App.tsx`.
*   **Gerenciamento de Dados**: Para todas as operações de busca, cache, sincronização e atualização de dados do servidor, utilize `Tanstack Query`.
*   **Backend**: Interaja com o backend através do cliente `Supabase` (`@/integrations/supabase/client`). Todas as operações de banco de dados, autenticação e armazenamento devem ser realizadas via Supabase.
*   **Ícones**: Para adicionar ícones à aplicação, utilize a biblioteca `lucide-react`.
*   **Notificações**: Para exibir mensagens de feedback ao usuário (sucesso, erro, informação), utilize a biblioteca `sonner`.
*   **Datas**: Para formatação, parseamento e manipulação de datas, utilize a biblioteca `date-fns`.
*   **Gráficos**: Para visualização de dados em gráficos, utilize a biblioteca `recharts`.
*   **Formulários**: Para gerenciamento de formulários, utilize `react-hook-form` em conjunto com `zod` para validação de esquemas.