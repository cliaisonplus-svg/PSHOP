# Fix pour les binaires natifs Rollup sur Vercel

## Problème

Lors du build sur Vercel, l'erreur suivante peut survenir :

```
Error: Cannot find module '@rollup/rollup-linux-x64-gnu'
```

## Cause

- **Yarn** ne gère pas toujours correctement les `optionalDependencies`
- Rollup nécessite des **binaires natifs optionnels** selon la plateforme
- Sur **Vercel (Linux)**, le binaire `@rollup/rollup-linux-x64-gnu` est requis
- Yarn peut ignorer cette dépendance optionnelle lors de l'installation

## Solution

Un script `postinstall` a été ajouté pour forcer l'installation du binaire natif manquant.

### Fichiers modifiés/créés

1. **`package.json`** : Ajout du script `postinstall`
2. **`scripts/postinstall.js`** : Script qui installe automatiquement le binaire natif
3. **`vercel.json`** : Configuration Vercel pour utiliser Yarn
4. **`.npmrc`** : Configuration npm pour les dépendances optionnelles

### Comment ça fonctionne

1. Après `yarn install`, le script `postinstall` s'exécute automatiquement
2. Le script détecte la plateforme (Linux x64 sur Vercel)
3. Il vérifie si le binaire `@rollup/rollup-linux-x64-gnu` existe
4. Si absent, il l'installe avec `npm` (qui gère mieux les optionalDependencies)
5. Le build peut alors s'exécuter sans erreur

### Détails techniques

- **npm** est utilisé pour installer les binaires (même si on utilise Yarn)
- `--no-save` pour ne pas modifier `package.json`
- `--no-package-lock` pour ne pas créer de `package-lock.json`
- Le script ne fait **pas échouer** le build s'il échoue (non-bloquant)

## Test local

Pour tester localement (simuler Vercel) :

```bash
# Installer les dépendances
yarn install

# Le script postinstall s'exécutera automatiquement
# Vérifier que le binaire est installé
ls node_modules/@rollup/rollup-linux-x64-gnu

# Build
yarn build
```

## Vérification sur Vercel

1. Pousser les changements sur votre dépôt
2. Vercel détectera automatiquement les changements
3. Le build devrait réussir sans l'erreur `Cannot find module '@rollup/rollup-linux-x64-gnu'`

## Alternative manuelle

Si le script automatique ne fonctionne pas, vous pouvez ajouter manuellement dans `package.json` :

```json
{
  "optionalDependencies": {
    "@rollup/rollup-linux-x64-gnu": "latest"
  }
}
```

Mais cette approche n'est **pas recommandée** car elle ajoute une dépendance spécifique à une plateforme dans `package.json`.

## Support

Si le problème persiste :

1. Vérifier les logs de build sur Vercel
2. Vérifier que Node.js 18+ est utilisé (voir `vercel.json`)
3. Vérifier que Yarn est bien utilisé (voir `vercel.json`)
4. Vérifier que le script `postinstall` s'exécute (voir les logs)

