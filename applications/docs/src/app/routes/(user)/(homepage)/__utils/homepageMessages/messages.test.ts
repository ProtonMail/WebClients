import { addLocale, useLocale } from 'ttag'
import { createDeletePermanentlyDialogMessages } from './deletePermanentlyDialog'
import { createDocumentActionsMessages } from './documentActions'
import { createDocumentsTableMessages } from './documentsTable'
import { createInvitesTableMessages } from './invitesTable'
import { createSidebarMessages } from './sidebar'
import { createTrashMessages } from './trash'

// These are the msgids of the existing translations, which the messages must keep matching.
addLocale('fr', {
  charset: 'utf-8',
  headers: { 'plural-forms': 'nplurals=2; plural=(n > 1);' },
  contexts: {
    Action: {
      'Go to ${ planOrAppName }': ['Aller à ${ planOrAppName }'],
      'View ${ pendingCount } invitation': [
        'Voir ${ pendingCount } invitation',
        'Voir les ${ pendingCount } invitations',
      ],
    },
    Info: {
      'Are you sure you want to permanently delete "${ itemName }" from trash?': [
        'Voulez-vous vraiment supprimer définitivement « ${ itemName } » de la corbeille ?',
      ],
      '${ selection.selectedIds.length } selected': [
        '${ selection.selectedIds.length } sélectionné',
        '${ selection.selectedIds.length } sélectionnés',
      ],
    },
    Label: {
      'Select ${ document.name }': ['Sélectionner ${ document.name }'],
      'Created by ${ displayName }': ['Créé par ${ displayName }'],
      'Location ${ locationLabel }': ['Emplacement ${ locationLabel }'],
    },
    Notification: {
      '"${ newName }" renamed successfully': ['« ${ newName } » renommé'],
      '${ numberOfItems } item restored from trash': [
        '${ numberOfItems } élément restauré',
        '${ numberOfItems } éléments restaurés',
      ],
      '${ numberOfItems } item moved to trash': [
        '${ numberOfItems } élément mis à la corbeille',
        '${ numberOfItems } éléments mis à la corbeille',
      ],
      '${ count } item could not be moved to trash': [
        "${ count } élément n'a pas pu être mis à la corbeille",
        "${ count } éléments n'ont pas pu être mis à la corbeille",
      ],
    },
  },
})

beforeEach(() => {
  useLocale('fr')
})

afterEach(() => {
  useLocale('en')
})

it('translates the trash notifications with the plural form for the number of documents', () => {
  const { itemsRestored, itemsTrashed, itemsNotTrashed } = createTrashMessages().trash

  expect(itemsRestored(1)).toBe('1 élément restauré')
  expect(itemsRestored(3)).toBe('3 éléments restaurés')
  expect(itemsTrashed(2)).toBe('2 éléments mis à la corbeille')
  expect(itemsNotTrashed(1)).toBe("1 élément n'a pas pu être mis à la corbeille")
})

it('translates the selected count, the row checkbox and the row label', () => {
  const { selected, selectDocument, rowLabel } = createDocumentsTableMessages().documentsTable

  expect(selected({ selectedIds: ['a', 'b'] })).toBe('2 sélectionnés')
  expect(selectDocument({ name: 'Notes' })).toBe('Sélectionner Notes')
  expect(rowLabel.createdBy('Alice')).toBe('Créé par Alice')
  expect(rowLabel.location('Projets')).toBe('Emplacement Projets')
})

it('translates the link to view the pending invitations', () => {
  expect(createInvitesTableMessages().invitesTable.viewInvitations(5)).toBe('Voir les 5 invitations')
})

it('translates the strings that name a document or an app', () => {
  expect(createDeletePermanentlyDialogMessages().deletePermanentlyDialog.confirm('Notes')).toBe(
    'Voulez-vous vraiment supprimer définitivement « Notes » de la corbeille ?',
  )
  expect(createDocumentActionsMessages().documentActions.renamed('Notes')).toBe('« Notes » renommé')
  expect(createSidebarMessages().sidebar.goTo('Drive')).toBe('Aller à Drive')
})
