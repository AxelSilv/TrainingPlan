# Tarkista Network-välilehti

## Vaihe 1: Avaa Developer Tools

1. F12 tai Cmd + Option + I
2. Klikkaa **Network** -välilehteä

## Vaihe 2: Päivitä sivu ja tarkista

1. Päivitä sivu (F5 tai Cmd + R)
2. Etsi `/api/calendar/week` -pyyntö listasta
3. Klikkaa sitä

## Vaihe 3: Tarkista Response

1. Klikkaa **Response** -välilehteä
2. Pitäisi näkyä JSON-dataa
3. Jos näet `[]` (tyhjä array), tietokannassa ei ole dataa
4. Jos näet virheen, siellä on ongelma

## Vaihe 4: Tarkista Status

1. Tarkista **Status** -kenttä
2. Pitäisi olla **200** (onnistunut)
3. Jos on **500**, siellä on virhe
4. Jos on **401**, autentikointi-ongelma

## Vaihe 5: Tarkista Console

1. Klikkaa **Console** -välilehteä
2. Etsi virheitä jotka liittyvät:
   - "database"
   - "prisma"
   - "connection"
   - "fetch"

## Mitä etsiä:

- Jos `/api/calendar/week` palauttaa `[]` → Tietokannassa ei ole dataa
- Jos se palauttaa virheen → Tietokantayhteys-ongelma
- Jos se palauttaa dataa → Ongelma on frontendissä

