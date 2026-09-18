# Zanim — jak wrzucić kod na GitHub

Nie dostajesz ode mnie żadnego tajnego kodu ani tokenu.
Logujesz się na **swoje** konto GitHub. Reszta to wklejenie komend poniżej.

---

## Wariant A — bez komputera programisty (najprostszy)

1. Pobierz plik **zanim-github.zip** (przy tej wiadomości).
2. Rozpakuj go (dwuklik). Powstanie folder `zanim`.
3. Wejdź na [https://github.com/new](https://github.com/new)
4. **Repository name:** `zanim`
5. Zostaw **Public** (albo Private, jeśli wolisz).
6. **Nie** zaznaczaj „Add a README file”.
7. Kliknij **Create repository**.
8. Na stronie pustego repozytorium kliknij **uploading an existing file**.
9. Przeciągnij **całą zawartość** folderu `zanim` (nie sam folder-opakowanie).
10. Na dole: **Commit changes**.

Gotowe. Adres będzie wyglądał tak:
`https://github.com/TWOJA_NAZWA/zanim`

---

## Wariant B — komendy do wklejenia w terminalu

Najpierw na GitHubie utwórz puste repozytorium `zanim` (jak w krokach 3–7 powyżej).

Potem na komputerze, w rozpakowanym folderze, wklejaj **po kolei**:

```bash
cd zanim
git init
git add .
git commit -m "Zanim — poczekalnia zakupów"
git branch -M main
```

Potem **podmień TWOJA_NAZWA** na swój login z GitHuba i wklej:

```bash
git remote add origin https://github.com/TWOJA_NAZWA/zanim.git
git push -u origin main
```

GitHub zapyta o login. Hasło do `git push` to **nie** hasło do strony — to token:

1. GitHub → kółko w prawym górnym rogu → **Settings**
2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token (classic)**
4. Zaznacz uprawnienie **repo**
5. Skopiuj token i wklej go, gdy terminal poprosi o hasło

---

## Czego NIE wklejać

- nie wklejasz `node_modules`
- nie wklejasz haseł, kluczy Stripe, kluczy sklepów
- nie potrzebujesz kodu ode mnie — tylko swojego loginu GitHub
