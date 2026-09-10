# Integração dos bots com as estatísticas NEXO NETWORK

O painel recebe eventos externos em:

```text
POST https://nexobotss.vercel.app/api/statistics/events
```

Cada evento é isolado pelo `guildId`. A API só aceita o token do bot que foi conectado ao mesmo servidor durante o cadastro do cliente no painel.

## Autenticação

```http
Authorization: Bot SEU_TOKEN_DO_BOT
Content-Type: application/json
```

O token nunca deve ser salvo no código-fonte nem enviado em mensagens. O bot deve lê-lo da variável de ambiente que já utiliza para iniciar.

## Evento de recrutamento

```json
{
  "eventId": "recrutamento:ID_UNICO_DO_REGISTRO",
  "guildId": "ID_DO_SERVIDOR_DISCORD",
  "type": "recruitment",
  "actor": {
    "discordId": "ID_DO_RECRUTADOR",
    "name": "NOME_DO_RECRUTADOR"
  },
  "recruited": {
    "discordId": "ID_DO_RECRUTADO",
    "name": "NOME_DO_RECRUTADO"
  },
  "quantity": 1,
  "revenue": 0,
  "occurredAt": "2026-09-09T22:00:00.000Z"
}
```

## Evento de venda

```json
{
  "eventId": "venda:ID_UNICO_DA_VENDA",
  "guildId": "ID_DO_SERVIDOR_DISCORD",
  "type": "sale",
  "actor": {
    "discordId": "ID_DO_VENDEDOR",
    "name": "NOME_DO_VENDEDOR"
  },
  "product": {
    "id": "ID_OU_SLUG_DO_PRODUTO",
    "name": "NOME_DO_PRODUTO"
  },
  "quantity": 1,
  "revenue": 150.5,
  "occurredAt": "2026-09-09T22:00:00.000Z"
}
```

`revenue` é o valor total da venda, em reais. O mesmo `eventId` pode ser reenviado com segurança: a API identifica a duplicação e não soma duas vezes.

## Respostas

- `201`: evento registrado.
- `200`: evento já existia e não foi duplicado.
- `400`: corpo inválido.
- `401`: cabeçalho de autenticação ausente.
- `403`: bot, servidor ou licença não autorizados.
- `500`: falha interna ao persistir o evento.

## O que enviar quando formos editar o bot

Abra o projeto do bot no Codex e envie:

1. O caminho completo da pasta do bot.
2. O `package.json`.
3. O arquivo principal, normalmente `src/index.js` ou `src/index.ts`.
4. Os arquivos que confirmam um recrutamento.
5. Os arquivos que confirmam uma venda.
6. Os models ou serviços usados para salvar recrutamentos e vendas, se existirem.
7. O `.env.example` somente com os nomes das variáveis, sem valores secretos.

Não envie o token do Discord na conversa.

## Pedido pronto para usar no projeto do bot

```text
Entre no projeto deste bot e integre os eventos de recrutamento e venda com a API de estatísticas da NEXO NETWORK descrita em INTEGRACAO_BOT.md. Leia primeiro o package.json, o arquivo principal e os handlers de recrutamento e venda. Envie o evento apenas depois que a operação tiver sido confirmada com sucesso. Use o ID do servidor de origem, o membro responsável, o produto e o valor reais. Gere um eventId estável para impedir duplicações, use o token do bot já existente no .env para o cabeçalho Authorization e não altere o comportamento atual dos comandos.
```
