# Nilsa Lina Obobo — 43 Anos

Webapp de aniversário em português: uma história em capítulos (capa com slideshow → nome → amor → beleza/luta → comédia → guerreira → diagnóstico do coração → família → carta → vídeo → brinde → final).

Tons diferentes entre páginas: amor, memória, luta e comédia — misturados de propósito.

## Abrir o demo

```bash
cd aniversario-43
python3 -m http.server 8080
```

Abra: [http://localhost:8080](http://localhost:8080)

Ou abra `index.html` no navegador.

## Fotos e vídeos (dentro dos capítulos)

As imagens **fazem parte de cada capítulo** (não vão num zip separado). Já estão embutidas em `media/`:

| Ficheiro | Uso |
|----------|-----|
| `capa.jpg` | Capa, beleza, carta, final |
| `memoria.jpg` | Memória, amor, família |
| `guerreira.jpg` | Beleza interior, lutadora, carta |
| `comedia.jpg` | Comédia, brinde, celebração |

Para acrescentar **vídeo** no Capítulo 9, coloque o ficheiro aqui:

```text
aniversario-43/media/nilsa-historia.mp4
```

(opcional: também `nilsa-historia.webm`)

Para trocar fotos pessoais, substitua os ficheiros em `media/` ou edite os `src` / `background-image` em `index.html` — sempre dentro da página do capítulo.
