# Supabase

Use estes arquivos no `SQL Editor` do Supabase.

## Banco novo

Para uma instalacao nova, copie e execute o conteudo inteiro de:

```text
setup_no_functions.sql
```

Nao cole o nome do arquivo no SQL Editor. Abra o arquivo, copie o SQL dentro dele e clique em `Run`.

## Banco existente

Se o banco ja existia antes das melhorias, rode os patches em ordem.

Se aparecer:

```text
invalid input value for enum lead_status
```

execute primeiro:

```text
patches/001_expand_lead_status_enum_if_needed.sql
```

Depois rode os demais patches necessarios:

```text
patches/002_whatsapp_integration.sql
patches/003_google_places_capture.sql
patches/004_autonomy_fields.sql
patches/005_message_templates.sql
patches/006_whatsapp_inbox.sql
patches/007_manual_assisted_mode.sql
```

## Observacao

O arquivo principal `setup_no_functions.sql` nao usa funcoes nem blocos `$$`, para evitar erros de `unterminated dollar-quoted string` no painel do Supabase.
