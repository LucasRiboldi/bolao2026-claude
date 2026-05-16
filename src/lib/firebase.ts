import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            'AIzaSyAjgJ0H4I4Np12Q9OB1ptNKM-MjB_sKMMg',
  authDomain:        'bolao2026-a76c7.firebaseapp.com',
  projectId:         'bolao2026-a76c7',
  storageBucket:     'bolao2026-a76c7.firebasestorage.app',
  messagingSenderId: '645283705207',
  appId:             '1:645283705207:web:66db84cbf24cdb52e27172',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)

export const ADMIN_EMAIL = 'lucasriboldi.dev@gmail.com'
