# Aniversário 43 — Webapp em português

História em capítulos (capa → casamento → beleza/luta → comédia → guerreira → família → carta → brinde → final), com tons diferentes entre páginas.

## Abrir o demo

No computador:

```bash
cd aniversario-43
python3 -m http.server 8080
```

Depois abra: [http://localhost:8080](http://localhost:8080)

Ou abra `index.html` diretamente no navegador.

## Colocar as fotos dela nos capítulos

As fotos **fazem parte de cada capítulo** (não vão num zip separado). Substitua os blocos “Foto dela aqui” em `index.html` por:

```html
<img src="media/nome-da-foto.jpg" alt="Descrição" />
```

Sugestão de ficheiros em `media/`:

| Ficheiro | Capítulo |
|----------|----------|
| `casamento.jpg` | Capítulo 1 — slideshow |
| `retrato.jpg` | Capítulo 2 — beleza |
| `risa.jpg` | Capítulo 3 — comédia |
| `familia.jpg` | Capítulo 5 — família |
| `intima.jpg` | Capítulo 6 — carta |
| `festa.jpg` | Capítulo 7 — brinde |

As imagens de atmosfera já incluídas (`capa.jpg`, `memoria.jpg`, `guerreira.jpg`, `comedia.jpg`) são fundos artísticos dos capítulos.
