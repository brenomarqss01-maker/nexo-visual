# NEXO NETWORK Control Panel

Quero desenvolver um painel web completo para gerenciamento e configuração de bots Discord.

Como referência visual, utilize o site da CORE Network (https://corenetwork.dev/) e as imagens que anexei nesta conversa.

Quero que o frontend tenha uma identidade visual extremamente próxima da CORE Network, principalmente na área logada: fundo escuro, sidebar, cards, bordas, espaçamento, tipografia, hierarquia visual, botões, inputs, tabelas e sensação geral do painel.

IMPORTANTE: não quero copiar logos, textos ou identidade comercial da CORE. Quero reproduzir a linguagem visual/UI como referência, mas com a minha própria marca chamada NEXO NETWORK.

As imagens anexadas mostram exatamente o estilo que quero para a área do cliente e para o painel administrativo.

1. CONCEITO DO SISTEMA

O site será uma plataforma para vender e gerenciar bots Discord.

O funcionamento será:

ADMINISTRADOR
↓
Cria cliente
↓
Define qual sistema o cliente possui
↓
Define expiração
↓
Cliente entra com Discord
↓
Visualiza seus sistemas/bots
↓
Entra em um sistema
↓
Visualiza os campos de configuração
↓
Preenche IDs/configurações
↓
Clica em salvar
↓
Configuração é salva

Por enquanto não tenho banco de dados real.

Portanto, nessa primeira versão, faça tudo funcionando com dados fictícios/mock/local state, mas estruture o código de forma que posteriormente seja simples conectar um banco de dados real.

Não quero apenas telas estáticas. Os botões, formulários, criação de clientes, sistemas, campos e configurações precisam funcionar dentro do protótipo.

2. LOGIN

A tela inicial deve ser uma tela de login muito semelhante à referência da CORE.

Visual:

Fundo preto/cinza extremamente escuro

Card central

Logo NEXO NETWORK

Título "Área do Cliente"

Texto explicativo

Botão grande "Entrar com Discord"

Ícone do Discord

Visual minimalista

Bordas discretas

Tipografia moderna

Por enquanto, como não existe OAuth real, o botão pode simular o login.

Porém, crie uma lógica de usuário fictícia.

Utilize este Discord ID como administrador:

1063194868677095454

Quando o usuário logado possuir esse ID:

1063194868677095454

ele deve receber automaticamente acesso ao Painel Administrativo.

Qualquer outro usuário deve entrar na Área do Cliente.

3. ADMINISTRADOR

Quando o Discord ID for:

1063194868677095454

mostrar uma área administrativa diferente da área comum do cliente.

A sidebar administrativa pode possuir:

Gestão

Dashboard

Clientes

Sistemas

Usuários

Configurações

Configurações gerais

Logs

Quero que a sidebar siga a mesma linguagem visual das imagens enviadas.

4. DASHBOARD ADMINISTRATIVO

Criar uma dashboard com cards mostrando informações como:

Clientes
12

Sistemas
5

Licenças ativas
18

Licenças expiradas
3

Os números podem ser fictícios por enquanto.

Também quero uma tabela/listagem de clientes recentes.

5. CRIAR NOVO CLIENTE

Essa é uma das partes MAIS IMPORTANTES.

No painel administrativo deve existir um botão:

- Novo Cliente

Ao clicar, abrir uma modal ou página lateral/formulário.

Campos:

Nome do App

Exemplo:

New Era City

ID do Cliente

Exemplo:

1063194868677095454

Esse campo representa o Discord ID do cliente.

Sistema

Aqui deve existir um select/dropdown.

Exemplo:

Sistema de Ticket
Sistema de Hierarquia
Sistema de Farm
Sistema de Ausência

Esses sistemas NÃO devem ser fixos no código.

Eles precisam vir dos sistemas que o administrador cadastrou na seção Sistemas.

Expiração

Por padrão:

30 dias

Quando o cliente for criado, calcular automaticamente a data de expiração.

Exemplo:

Criado em: 03/08/2026
Expira em: 02/09/2026

Também quero mostrar:

Ativo

ou:

Expirado

dependendo da data.

Todos esses dados devem ser editáveis posteriormente.

6. CLIENTES

Na área:

Administração → Clientes

mostrar uma tabela parecida com a tabela da CORE.

Colunas:

CLIENTE
ID DISCORD
SISTEMAS
EXPIRAÇÃO
STATUS
AÇÕES

Ações:

Editar
Visualizar
Excluir

Ao clicar no cliente, mostrar todas as informações dele.

7. SISTEMAS — PARTE MAIS IMPORTANTE DO PROJETO

Quero criar um sistema dinâmico.

O administrador NÃO deve precisar editar código para criar um novo sistema.

Na área:

Administração → Sistemas

deve existir:

- Criar Sistema

Ao clicar:

Nome do Sistema

Exemplo:

Sistema de Ticket

Depois disso, quero poder criar os campos que aparecerão para os clientes.

8. CRIAÇÃO DOS CAMPOS DE UM SISTEMA

Por exemplo, quero criar:

Sistema de Ticket

E dentro dele adicionar:

Título:
Canal de Logs

Label:
ID do canal onde serão enviados os logs

Tipo:
Texto

Chave:
canal_logs

Depois clicar:

Adicionar campo

E poder criar outro:

Título:
Categoria dos Tickets

Label:
ID da categoria onde os tickets serão criados

Tipo:
Texto

Chave:
categoria_ticket

E outro:

Título:
Cargo de Suporte

Label:
ID do cargo que poderá atender os tickets

Tipo:
Texto

Chave:
cargo_suporte

Quero continuar adicionando campos quantos forem necessários.

A interface de criação deve permitir:

NOME DO SISTEMA

---

CAMPO 1

Título
[ Canal de Logs ]

Label
[ ID do canal onde serão enviados os logs ]

Chave
[ canal_logs ]

Tipo
[ Texto ▼ ]

[ Remover campo ]

---

CAMPO 2

Título
[ Categoria dos Tickets ]

Label
[ ID da categoria ]

Chave
[ categoria_ticket ]

Tipo
[ Texto ▼ ]

[ Remover campo ]

---

- Adicionar campo

[ SALVAR SISTEMA ]

Quando eu clicar em Adicionar campo, deve criar um novo bloco de campo.

Quando eu clicar em Salvar Sistema, o sistema inteiro deve ser salvo no estado mock.

9. TIPOS DE CAMPOS

Deixe o sistema preparado para vários tipos:

Texto
Número
ID Discord
Canal Discord
Cargo Discord
Categoria Discord
Booleano / Ativado-Desativado
Select

Por enquanto não precisa validar os IDs com a API do Discord.

A ideia é deixar a estrutura preparada.

10. COMO OS DADOS DEVEM SER REPRESENTADOS

Essa parte é MUITO IMPORTANTE.

Cada campo criado pelo administrador deve possuir uma chave única.

Exemplo:

Sistema:

Sistema de Recrutamento

Campos:

id_registro_rec
nome_banner_rec
canal_logs_rec
cargo_aprovado_rec

Quando o cliente preencher:

ID Registro:
292939392392

Nome Banner:
0220200220

a estrutura de dados simulada deve ficar conceitualmente assim:

{
clientId: "1063194868677095454",

systemId: "sistema_recrutamento",

config: {
id_registro_rec: "292939392392",
nome_banner_rec: "0220200220"
}
}

Isso é fundamental.

O frontend não deve simplesmente guardar tudo baseado no texto visual.

Cada campo precisa ter uma key, porque posteriormente essa configuração será enviada para o bot/backend.

11. ÁREA DO CLIENTE

Quando um usuário comum entrar com o Discord, ele NÃO pode ver o painel administrativo.

Ele deve visualizar somente os sistemas que foram atribuídos a ele.

A área deve ser inspirada diretamente na tela da CORE que enviei.

Sidebar:

NEXO NETWORK

ÁREA DO CLIENTE

Licenças

Na parte inferior:

[Avatar]

Nome do cliente
CLIENTE

[ícone sair]

12. PÁGINA "SEUS SISTEMAS"

Em vez de simplesmente mostrar uma tabela vazia, quero que o cliente consiga visualizar seus sistemas.

Exemplo:

Seus Sistemas

Aqui você pode configurar todos os sistemas vinculados à sua conta.

Cards ou tabela:

SISTEMA STATUS EXPIRAÇÃO AÇÕES

Sistema de Ticket ATIVO 02/09/2026 Configurar
Sistema de Farm ATIVO 02/09/2026 Configurar
Sistema de Hierarquia ATIVO 02/09/2026 Configurar

13. QUANDO O CLIENTE CLICAR EM UM SISTEMA

Essa é a experiência principal.

Por exemplo, cliente entra em:

Sistema de Ticket

O sistema deve buscar todos os campos cadastrados pelo administrador para esse sistema.

Então automaticamente aparecerá:

Sistema de Ticket

Configure seu sistema abaixo.

Canal de Logs
ID do canal onde serão enviados os logs

[ 123456789012345678 ]

Categoria dos Tickets
ID da categoria onde os tickets serão criados

[ 123456789012345678 ]

Cargo de Suporte
ID do cargo que poderá atender os tickets

[ 123456789012345678 ]

                  [ Salvar Configurações ]

Se amanhã eu criar mais 10 campos no administrador, eles devem aparecer automaticamente para o cliente.

NÃO criar esses campos manualmente na página do cliente.

Eles devem ser gerados dinamicamente de acordo com a configuração do sistema.

14. SALVAR CONFIGURAÇÃO

Quando o cliente clicar:

Salvar Configurações

mostrar uma mensagem discreta:

Configurações salvas com sucesso.

E atualizar o mock/local state.

Por exemplo:

{
clientId: "1063194868677095454",

systems: {
sistema_ticket: {
canal_logs: "123456789",
categoria_ticket: "987654321",
cargo_suporte: "555555555"
}
}
}

15. IMPORTANTE: ADMINISTRADOR CRIA A ESTRUTURA, CLIENTE PREENCHE OS VALORES

Quero deixar isso muito claro na arquitetura.

O administrador define:

Nome do sistema
↓
Campos
↓
Título
↓
Label
↓
Chave
↓
Tipo

O cliente define:

Valor daquele campo

Exemplo:

ADMIN:

Título:
Canal de Logs

Label:
Informe o ID do canal de logs

Key:
canal_logs

CLIENTE:

Canal de Logs

Informe o ID do canal de logs

123456789012345678

Resultado:

{
canal_logs: "123456789012345678"
}

Essa separação precisa existir desde o começo.

16. VINCULAR SISTEMAS A CLIENTES

Ao criar um cliente, o administrador escolhe:

Nome do App
ID do Cliente
Sistema
Expiração

Porém um cliente poderá ter mais de um sistema.

Então na edição do cliente deve ser possível:

Sistemas vinculados

[x] Sistema de Ticket
[x] Sistema de Hierarquia
[ ] Sistema de Farm
[ ] Sistema de Ausência

- Adicionar sistema

Assim, o cliente só enxerga os sistemas que foram atribuídos à conta dele.

17. EXPIRAÇÃO

Todo vínculo entre cliente e sistema possui uma data de expiração.

Padrão:

30 dias

Na área do cliente mostrar:

Expira em 29 dias

Quando expirar:

EXPIRADO

O cliente não poderá editar as configurações daquele sistema enquanto estiver expirado.

No painel administrativo, mostrar claramente:

ATIVO
EXPIRADO

18. DADOS MOCK

Como ainda não tenho banco de dados, criar uma camada de dados mock bem organizada.

Quero conseguir futuramente substituir:

Mock Data

por:

Supabase / PostgreSQL / API própria

sem precisar reconstruir todo o frontend.

Separar a lógica de:

clientes
sistemas
campos
licenças
configurações
usuários

19. DESIGN

O design é extremamente importante.

Use como referência visual principal:

CORE Network — corenetwork.dev

Quero:

Dark mode

Preto/cinza muito escuro

Cards escuros

Bordas finas

Cantos arredondados

Tipografia moderna

Sidebar fixa

Inputs escuros

Botões minimalistas

Verde somente quando fizer sentido para ações/status

Muito espaço negativo

Interface limpa

Nada colorido demais

Nada com aparência de template genérico

Microinterações suaves

Hover states

Transições rápidas

Modais elegantes

Tabelas modernas

A referência visual deve ser principalmente a área interna/logada, como nas imagens enviadas.

20. RESPONSIVIDADE

O painel deve funcionar em:

Desktop
Notebook
Tablet
Celular

No celular, transformar a sidebar em menu lateral recolhível.

21. EXPERIÊNCIA FINAL

Quero que a experiência seja:

Administrador

Login Discord
↓
ID = 1063194868677095454
↓
Painel Administrativo
↓
Criar Sistema
↓
Criar campos
↓
Salvar Sistema
↓
Criar Cliente
↓
Selecionar Sistema
↓
Definir expiração
↓
Cliente recebe acesso

Cliente

Login Discord
↓
Área do Cliente
↓
Meus Sistemas
↓
Sistema de Ticket
↓
Campos criados pelo administrador
↓
Cliente preenche
↓
Salvar
↓
Configuração armazenada

22. NÃO FAZER

Não quero:

Um site institucional genérico.

Um simples formulário de configuração.

Campos fixos escritos manualmente no frontend.

Sistemas fixos no código.

Um painel administrativo separado sem relação com o painel do cliente.

Dados fictícios que desaparecem imediatamente após navegar entre páginas.

Apenas HTML estático.

Botões que não fazem nada.

Layout genérico de dashboard.

Quero um protótipo funcional de uma plataforma SaaS de gerenciamento de configurações de bots Discord, com a arquitetura preparada para posteriormente conectar banco de dados e Discord OAuth.

23. PRIORIDADE

Priorize nesta ordem:

1. Área do Cliente

2. Sistema dinâmico de criação de sistemas

3. Sistema dinâmico de criação de campos

4. Salvamento das configurações

5. Painel Administrativo

6. Clientes e licenças

7. Login/controle por Discord ID

8. Design e refinamento visual

O frontend precisa parecer um produto real e pronto para produção, não um protótipo básico.

Uma observação importante

A lógica que você imaginou está certa, e a parte mais importante é justamente essa:

Você não cria "Sistema de Ticket" diretamente dentro da página do cliente.

Você cria um modelo de sistema no administrador.

Por exemplo:

SISTEMA DE TICKET
│
├── canal_logs
├── categoria_ticket
├── cargo_suporte
├── cargo_administrador
└── mensagem_abertura

Depois você vincula esse sistema ao cliente.

O cliente só recebe:

SISTEMA DE TICKET

Canal de Logs
[____________]

Categoria
[____________]

Cargo Suporte
[____________]

Cargo Administrador
[____________]

Mensagem de abertura
[____________]

[ SALVAR ]

E o resultado fica mais ou menos:

cliente
↓
sistema_ticket
↓
config
├── canal_logs
├── categoria_ticket
├── cargo_suporte
├── cargo_administrador
└── mensagem_abertura

Essa estrutura é o que vai permitir que você tenha 5, 10 ou 50 sistemas diferentes sem precisar ficar pedindo para a IA alterar o frontend toda vez que criar um bot novo.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1547d289-f9df-4254-b420-c2d94163a9b7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
