# cotton / redesign

Machetă pentru [uniforme-cotton.md](https://uniforme-cotton.md): prima pagină, varianta aleasă.
HTML + CSS + JS, fără framework și fără build.

```bash
python3 -m http.server 4178
```

Apoi deschide `http://localhost:4178`.

```
index.html
assets/css/varianta-b.css
assets/js/varianta-b.js
assets/img/brand/    logotipul cotton (folosit ca mască, ca să poată fi colorat)
assets/img/cut/      haine decupate din fotografiile catalogului
assets/img/photo/    fotografii de atelier de pe site
assets/img/avatar/   decupaje din fotografiile clienților, centrate pe logo
assets/img/src/      sursa imaginii cu broderie (vezi mai jos)
tools/               scripturile pentru tipar și pentru broderie
```

## De unde vine designul

Din polca de referințe a proiectului, nu dintr-un șablon. Pagina pornește de la cele patru
referințe marcate „из ролика”; fiecare secțiune din `index.html` are un comentariu care spune
ce referință stă în spate.

| Ce | Referință |
|---|---|
| Haina frontal în centru, interfața prin colțuri; pagina trece din închis în deschis la scroll | Radian EXR |
| Titlul jos în stânga pe două rânduri, bloc mic sus în dreapta, mult gol; carduri cu fotografia sus și textul jos | Refive |
| Perechea Unbounded + Onest; cifra „−20%” ca erou | Fire n' Smoke |
| Header dens pe o linie, plăcuțe cu colț tăiat, plăcuța rotundă de termen, avatarele clienților ca dovadă | TGK Auto |
| Tiparul tunicii desenat în spatele ei | tehnica „tech-layer” din polcă |

- Secțiunile unde se aleg culori (catalogul, țesăturile) sunt pe deschis; restul pe închis.
- Catalogul e o scenă lipită pe desktop: scroll-ul trece prin cele patru categorii.
  Pe telefon devine patru blocuri unul sub altul.
- Butoanele sunt dreptunghiuri simple; colțul tăiat rămâne doar pe plăcuțe.

## Regulile din brief-ul polcii, aplicate

- două familii de litere: Unbounded + Onest
- cifra mare față de text: ×16,9 la 1440px (regula cere de la ×10,8)
- container 1520px, secțiuni 80–160px, gap 20px
- tranziții 0,3s / 0,5s / 0,6s pe `cubic-bezier(.215,.61,.355,1)`
- o singură mișcare pe tot site-ul: parallax; trecerile de temă și hover-urile sunt stări, nu animații
- titlul nu intră peste obiect: în hero se oprește la 114px de tunică
- separator doar „/”, fără punct median
- conținut și imagini de pe uniforme-cotton.md; textele nu promit ce nu e scris pe site

## Hero: tiparul și broderia

În spatele tunicii K006 e desenat tiparul ei, ca pe o masă de croit: linia de croi (continuă),
linia cusăturii (punctată), crestături și sensul firului. Contururile sunt calculate din silueta
tunicii, deci o urmăresc exact. Dacă se schimbă tunica, tiparul se regenerează (cere Pillow):

```bash
python3 tools/pattern.py assets/img/cut/k006-dark.webp tipar.svg
```

Conținutul fișierului rezultat înlocuiește elementul `<svg class="hero__tipar">` din `index.html`.

La hover peste tunică apare aceeași tunică, cu logoul brodat pe piept: rezultatul serviciului.
Linia cusăturii se aprinde, iar o adnotare duce de la logo la „Broderie / de la 50 MDL / buc.”.
Pe telefon și de la tastatură comută butonul „Vezi cu broderie” de sub tunică.

- Imaginea cu broderie e **generată**, nu fotografiată: OpenAI `gpt-image-2`, endpointul de editare,
  pe fotografia reală K006, cu mască doar pe piept și cu logoul cotton ca referință. Apoi doar zona
  pieptului a fost lipită peste fotografia originală, deci restul tunicii e identic.
- **Înainte de lansare se înlocuiește cu o fotografie reală** a unei tunici brodate în atelier.
  Decupajul trebuie să aibă aceeași încadrare ca `assets/img/cut/k006-dark.webp` (674×881).
- Sursa: `assets/img/src/k006-brodat-sursa.jpg`. Regenerare, cu intrările din `tools/embroider/`:

```bash
OPENAI_API_KEY=... bash tools/embroider.sh tools/embroider gpt-image-2 none
```

## Date reale folosite

- numărul de modele pe categorii: API-ul public WooCommerce (`/wp-json/wc/store/v1/products/categories`)
- produse, prețuri, țesături și numărul de culori: paginile de categorie în română
  (endpointul de produse din API dă eroare 500 pe server)
- fotografii: biblioteca site-ului

## Ce e încă machetă

- formularul nu trimite nimic; spune asta explicit după „Trimite”
- comutatorul RO / RU e doar vizual
- legăturile de catalog duc spre site-ul actual, până construim pagina de catalog
- calculul de preț folosește prețurile și scara de reduceri de pe site; broderia e
  adăugată ca „de la 50 MDL / buc.”, fără reducere, pentru că site-ul nu spune altfel
- imaginea cu broderie din hero e generată (vezi mai sus)
