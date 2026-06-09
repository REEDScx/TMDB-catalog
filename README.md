# CineStream TMDB Catalog

Aplicação web moderna de catálogo de filmes construída com HTML, CSS e JavaScript puro, consumindo a API do TMDB.

## Como executar

1. Abra o projeto em um servidor estático. Exemplo:

   ```bash
   python3 -m http.server 4173
   ```

2. Acesse `http://localhost:4173`.
3. Clique em **Configurar API Key** e informe sua chave do TMDB. A chave fica salva apenas no `LocalStorage` do navegador.

Também é possível informar a chave pela URL uma vez:

```text
http://localhost:4173/?api_key=SUA_CHAVE_TMDB
```

## Recursos implementados

- Home com banner principal, filmes populares, melhores avaliados, lançamentos e em cartaz.
- Pesquisa em tempo real com resultados instantâneos.
- Página de detalhes com backdrop, poster, metadados, sinopse, elenco, trailer e recomendações.
- Favoritos persistidos em `LocalStorage`.
- Skeleton loading, lazy loading de imagens, infinite scroll, paginação visual, scroll suave, botão voltar ao topo e compartilhamento.
