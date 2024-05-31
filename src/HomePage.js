import React, { useState, useEffect } from 'react';
import './homepage.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { slide as Menu } from 'react-burger-menu';
import { useMediaQuery } from 'react-responsive';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  const [currentView, setCurrentView] = useState('asteCaricate');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aste, setAste] = useState([]);
  const [lotti, setLotti] = useState([]);
  const [utenti, setUtenti] = useState([]);
  const [currentAsta, setCurrentAsta] = useState(null);
  const [currentLotto, setCurrentLotto] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [categories] = useState(['Arte Moderna', 'Arte Contemporanea', 'Gioielli', 'Antiquariato', 'Libri Antichi', 'Altro']);
  const [auctionCategory, setAuctionCategory] = useState('');
  const [hours, setHours] = useState('');

  const fetchAste = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "asta"));
      const asteData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAste(asteData);
    } catch (error) {
      console.error("Errore nel recuperare le aste: ", error);
    }
  };

  const fetchLotti = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "lotti"));
      const lottiData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLotti(lottiData);
    } catch (error) {
      console.error("Errore nel recuperare i lotti: ", error);
    }
  };

  const fetchUtenti = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "utenti"));
      const utentiData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUtenti(utentiData);
    } catch (error) {
      console.error("Errore nel recuperare gli utenti: ", error);
    }
  };

  useEffect(() => {
    fetchAste();
    fetchLotti();
    fetchUtenti();
  }, []);

  const handleViewChange = (view) => {
    setCurrentView(view);
    setSelectedItems([]);
  };

  const handleImagesChange = (event) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files).slice(0, 10);
      setImages(filesArray);
    }
  };

  const handleAuctionCategoryChange = (event) => {
    setAuctionCategory(event.target.value);
  };

  const handleHoursChange = (event) => {
    setHours(event.target.value);
  };

  const handleSubmit = async (event, collectionName) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (images.length === 0) {
      setError("Per favore, seleziona almeno un'immagine da caricare.");
      setLoading(false);
      return;
    }

    try {
      const imageUrls = [];
      for (const image of images) {
        const imageRef = ref(storage, `images/${image.name}`);
        const snapshot = await uploadBytes(imageRef, image);
        const imageUrl = await getDownloadURL(snapshot.ref);
        imageUrls.push(imageUrl);
      }

      if (!user) {
        setError("Utente non definito, impossibile salvare il documento.");
        setLoading(false);
        return;
      }

      const data = {
        nome: event.target.nome.value,
        descrizione: event.target.descrizione.value,
        imageUrls: imageUrls,
        categoria: auctionCategory,
        ore: auctionCategory === 'a tempo' ? hours : null
      };

      if (collectionName === "asta") {
        data.dataInizio = event.target.dataInizio.value;
        data.dataFine = event.target.dataFine.value;
        await setDoc(doc(db, collectionName, data.nome), data);
      } else if (collectionName === "lotti") {
        data.asta = event.target.asta.value;
        data.categoria = event.target.categoria.value;
        data.datazione = event.target.datazione.value;
        data.stima = event.target.stima.value;
        data.prezzoIniziale = event.target.prezzoIniziale.value;
        data.prezzoAttuale = event.target.prezzoAttuale.value;
        data.prezzoRiserva = event.target.prezzoRiserva.value;
        data.dimensioni = event.target.dimensioni.value;
        await setDoc(doc(db, collectionName, data.nome), data);
      }

      setImages([]);
      event.target.reset();
      setLoading(false);
      setCurrentView(collectionName === "asta" ? 'asteCaricate' : 'lottiCaricati');
      fetchAste();
      fetchLotti();
    } catch (error) {
      console.error("Errore nel salvare il documento: ", error);
      setError("Errore nel salvare il documento!");
      setLoading(false);
    }
  };

  const handleDelete = async (id, collectionName) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      if (collectionName === "asta") {
        fetchAste();
      } else if (collectionName === "lotti") {
        fetchLotti();
      } else if (collectionName === "utenti") {
        fetchUtenti();
      }
    } catch (error) {
      console.error("Errore nella cancellazione: ", error);
    }
  };

  const handleBulkDelete = async (collectionName) => {
    try {
      const batchDelete = selectedItems.map(id => deleteDoc(doc(db, collectionName, id)));
      await Promise.all(batchDelete);
      if (collectionName === "asta") {
        fetchAste();
      } else if (collectionName === "lotti") {
        fetchLotti();
      }
      setSelectedItems([]);
    } catch (error) {
      console.error("Errore nella cancellazione: ", error);
    }
  };

  const handleEdit = async (id, collectionName) => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        if (collectionName === "asta") {
          setCurrentAsta({ id: docRef.id, ...docSnap.data() });
          setCurrentView('modificaAsta');
        } else if (collectionName === "lotti") {
          setCurrentLotto({ id: docRef.id, ...docSnap.data() });
          setCurrentView('modificaLotto');
        }
      } else {
        console.error("Nessun documento trovato!");
      }
    } catch (error) {
      console.error("Errore nel recuperare il documento: ", error);
    }
  };

  const handleUpdate = async (event, collectionName) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      let imageUrls;
      if (collectionName === "asta") {
        imageUrls = currentAsta.imageUrls || [];
        if (images.length > 0) {
          imageUrls = [];
          for (const image of images) {
            const imageRef = ref(storage, `images/${image.name}`);
            const snapshot = await uploadBytes(imageRef, image);
            const imageUrl = await getDownloadURL(snapshot.ref);
            imageUrls.push(imageUrl);
          }
        }

        const docRef = doc(db, collectionName, currentAsta.id);
        await updateDoc(docRef, {
          nome: currentAsta.nome,
          descrizione: currentAsta.descrizione,
          imageUrls: imageUrls,
          dataInizio: currentAsta.dataInizio,
          dataFine: currentAsta.dataFine,
          categoria: auctionCategory,
          ore: auctionCategory === 'a tempo' ? hours : null
        });
      } else if (collectionName === "lotti") {
        imageUrls = currentLotto.imageUrls || [];
        if (images.length > 0) {
          imageUrls = [];
          for (const image of images) {
            const imageRef = ref(storage, `images/${image.name}`);
            const snapshot = await uploadBytes(imageRef, image);
            const imageUrl = await getDownloadURL(snapshot.ref);
            imageUrls.push(imageUrl);
          }
        }

        const docRef = doc(db, collectionName, currentLotto.id);
        await updateDoc(docRef, {
          nome: currentLotto.nome,
          descrizione: currentLotto.descrizione,
          imageUrls: imageUrls,
          asta: currentLotto.asta,
          categoria: currentLotto.categoria,
          datazione: currentLotto.datazione,
          stima: currentLotto.stima,
          prezzoIniziale: currentLotto.prezzoIniziale,
          prezzoAttuale: currentLotto.prezzoAttuale,
          prezzoRiserva: currentLotto.prezzoRiserva,
          dimensioni: currentLotto.dimensioni
        });
      }

      setImages([]);
      setLoading(false);
      setCurrentView(collectionName === "asta" ? 'asteCaricate' : 'lottiCaricati');
      fetchAste();
      fetchLotti();
    } catch (error) {
      console.error("Errore nell'aggiornare il documento: ", error);
      setError("Errore nell'aggiornare il documento!");
      setLoading(false);
    }
  };

  const handleChange = (e, collectionName) => {
    if (collectionName === "asta") {
      setCurrentAsta({ ...currentAsta, [e.target.name]: e.target.value });
    } else if (collectionName === "lotti") {
      setCurrentLotto({ ...currentLotto, [e.target.name]: e.target.value });
    }
  };

  const handleSelect = (id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = (items) => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleSiteRedirect = () => {
    window.location.href = 'http://parthenopeaste.com/';
  };

  return (
    <div className="div">
      {isMobile && (
        <Menu>
          <div className={`div-16 ${currentView === 'asteCaricate' ? 'selected' : ''}`} onClick={() => handleViewChange('asteCaricate')}>
            {currentView === 'asteCaricate' && <span>— </span>}<span style={{ fontWeight: 400 }}>Aste caricate</span>
          </div>
          <div className={`div-16 ${currentView === 'lottiCaricati' ? 'selected' : ''}`} onClick={() => handleViewChange('lottiCaricati')}>
            {currentView === 'lottiCaricati' && <span>— </span>}<span style={{ fontWeight: 400 }}>Lotti caricati</span>
          </div>
          <div className={`div-16 ${currentView === 'utentiCaricati' ? 'selected' : ''}`} onClick={() => handleViewChange('utentiCaricati')}>
            {currentView === 'utentiCaricati' && <span>— </span>}<span style={{ fontWeight: 400 }}>Utenti</span>
          </div>
          <div className="div-16">Lotti venduti</div>
          <div className="div-16">Panoramica vendite</div>
          <div className="div-16">Pagamenti</div>
          <div className="div-23">Impostazioni</div>
          <div className="div-24">Messaggi</div>
          <div className="div-25">Log out</div>
        </Menu>
      )}
      <div className="div-2">
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/ce40b2812789ab14b97858bf19696b51ceffc41e4dde08d2cff47ca741ac9c70?apiKey=a5b59b9e13064bfe901fb6595ac6cc54&"
          className="img"
          alt="Panel Image"
        />
        <div className="div-3">
          <div className="div-4">
            <div className="div-7" onClick={handleSiteRedirect}>Passa al sito</div>
            <div className="div-8"></div>
            <div className="div-9">
              <div className="div-10">
                <div className="div-11">{user}</div>
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/bad284be5348340598dbab27fc6bd011d8a64d6b675fe4d157827ff0e5f99a2d?apiKey=a5b59b9e13064bfe901fb6595ac6cc54&"
                  className="img-2"
                  alt="User Thumbnail"
                />
              </div>
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/8468e25d96bec456257a162eec6358fe8e0c5e7c194dff5188eae752aa1adcda?apiKey=a5b59b9e13064bfe901fb6595ac6cc54&"
                className="img-3"
                alt="Decoration Image"
              />
            </div>
          </div>
          <div className="div-12"></div>
        </div>
      </div>
      <div className="div-13">
        <div className="div-14">
          {!isMobile && (
            <div className="div-15">
              <div className={` div-16 ${currentView === 'asteCaricate' ? 'selected' : ''}`} onClick={() => handleViewChange('asteCaricate')}>
                {currentView === 'asteCaricate' && <span>— </span>}<span style={{ fontWeight: 400 }}>Aste caricate</span>
              </div>
              <div className={` div-16 ${currentView === 'lottiCaricati' ? 'selected' : ''}`} onClick={() => handleViewChange('lottiCaricati')}>
                {currentView === 'lottiCaricati' && <span>— </span>}<span style={{ fontWeight: 400 }}>Lotti caricati</span>
              </div>
              <div className={` div-16 ${currentView === 'utentiCaricati' ? 'selected' : ''}`} onClick={() => handleViewChange('utentiCaricati')}>
                {currentView === 'utentiCaricati' && <span>— </span>}<span style={{ fontWeight: 400 }}>Utenti</span>
              </div>
              <div className=" div-19">Lotti venduti</div>
              <div className=" div-20">Panoramica vendite</div>
              <div className=" div-21">Pagamenti</div>
              <div className=" div-23">Impostazioni</div>
              <div className=" div-24">Messaggi</div>
              <div className="div-25">Log out</div>
            </div>
          )}
          <div className="div-26">
            <div className="div-27">
              {currentView === 'asteCaricate' && (
                <div className="div-28">
                  <div className="column">
                    <div className="div-29">
                      <div className="div-30">Aste Presentate</div>
                    </div>
                    <div className="div-31">
                      
                      <table className="aste-table">
                        <thead>
                          <tr>
                            <th><input type="checkbox" onChange={() => handleSelectAll(aste)} /></th>
                            <th>Copertina</th>
                            <th>Nome</th>
                            <th>Descrizione</th>
                            <th>Data Inizio</th>
                            <th>Data Fine</th>
                            <th>Azioni <button onClick={() => handleBulkDelete('asta')}>
                                  <svg fill="#065a74" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#065a74" className="icon glyph"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M17,4V5H15V4H9V5H7V4A2,2,0,0,1,9,2h6A2,2,0,0,1,17,4Z"></path><path d="M20,6H4A1,1,0,0,0,4,8H5V20a2,2,0,0,0,2,2H17a2,2,0,0,0,2-2V8h1a1,1,0,0,0,0-2ZM11,17a1,1,0,0,1-2,0V11a1,1,0,0,1,2,0Zm4,0a1,1,0,0,1-2,0V11a1,1,0,0,1,2,0Z"></path></g></svg>
                                </button>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {aste.map((asta, index) => (
                            <tr key={index}>
                              <td><input type="checkbox" checked={selectedItems.includes(asta.id)} onChange={() => handleSelect(asta.id)} /></td>
                              <td><img src={asta.imageUrls ? asta.imageUrls[0] : ''} alt={asta.nome} className="copertina-img" /></td>
                              <td>{asta.nome}</td>
                              <td>{asta.descrizione}</td>
                              <td>{asta.dataInizio}</td>
                              <td>{asta.dataFine}</td>
                              <td>
                                <button onClick={() => handleEdit(asta.id, 'asta')}>
                                  <svg fill="#073b4c" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#073b4c" className="icon glyph"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M8.661,19.113,3,21l1.887-5.661ZM20.386,7.388a2.1,2.1,0,0,0,0-2.965l-.809-.809a2.1,2.1,0,0,0-2.965,0L6.571,13.655l3.774,3.774Z"></path></g></svg>
                                </button>
                                <button onClick={() => handleDelete(asta.id, 'asta')}>
                                  <svg fill="#065a74" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#065a74" className="icon glyph"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M17,4V5H15V4H9V5H7V4A2,2,0,0,1,9,2h6A2,2,0,0,1,17,4Z"></path><path d="M20,6H4A1,1,0,0,0,4,8H5V20a2,2,0,0,0,2,2H17a2,2,0,0,0,2-2V8h1a1,1,0,0,0,0-2ZM11,17a1,1,0,0,1-2,0V11a1,1,0,0,1,2,0Zm4,0a1,1,0,0,1-2,0V11a1,1,0,0,1,2,0Z"></path></g></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="column-2">
                    <div className="div-39">
                      <div className="div-40" onClick={() => handleViewChange('presentaAsta')} >Presenta asta</div>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'lottiCaricati' && (
                <div className="div-28">
                  <div className="column">
                    <div className="div-29">
                      <div className="div-30">Lotti Presentati</div>
                    </div>
                    <div className="div-31">
                      <button onClick={() => handleBulkDelete('lotti')}>Elimina Selezionati</button>
                      <table className="aste-table">
                        <thead>
                          <tr>
                            <th><input type="checkbox" onChange={() => handleSelectAll(lotti)} /></th>
                            <th>Copertina</th>
                            <th>Nome</th>           
                            <th>Categoria</th>
                            <th>Prezzo Iniziale</th>
                            <th>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lotti.map((lotto, index) => (
                            <tr key={index}>
                              <td><input type="checkbox" checked={selectedItems.includes(lotto.id)} onChange={() => handleSelect(lotto.id)} /></td>
                              <td><img src={lotto.imageUrls ? lotto.imageUrls[0] : ''} alt={lotto.nome} className="copertina-img" /></td>
                              <td>{lotto.nome}</td>
                              <td>{lotto.categoria}</td>
                              <td>{lotto.prezzoIniziale}</td>
                              <td>
                                <button onClick={() => handleEdit(lotto.id, 'lotti')}>
                                  <svg fill="#073b4c" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#073b4c" className="icon glyph"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M8.661,19.113,3,21l1.887-5.661ZM20.386,7.388a2.1,2.1,0,0,0,0-2.965l-.809-.809a2.1,2.1,0,0,0-2.965,0L6.571,13.655l3.774,3.774Z"></path></g></svg>
                                </button>
                                <button onClick={() => handleDelete(lotto.id, 'lotti')}>
                                  <svg fill="#065a74" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#065a74" className="icon glyph"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M17,4V5H15V4H9V5H7V4A2,2,0,0,1,9,2h6A2,2,0,0,1,17,4Z"></path><path d="M20,6H4A1,1,0,0,0,4,8H5V20a2,2,0,0,0,2,2H17a2,2,0,0,0,2-2V8h1a1,1,0,0,0,0-2ZM11,17a1,1,0,0,1-2,0V11a1,1,0,0,1,2,0Zm4,0a1,1,0,0,1-2,0V11a1,1,0,0,1,2,0Z"></path></g></svg>
                                </button>
                                <button>
                                  <svg viewBox="0 -4.5 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#1e2c4c"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><title>arrow_down [#1e2c4c]</title><desc>Created with Sketch.</desc><defs></defs><g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"><g id="Dribbble-Light-Preview" transform="translate(-220.000000, -6684.000000)" fill="#1e2c4c"><g id="icons" transform="translate(56.000000, 160.000000)"><path d="M164.292308,6524.36583 L164.292308,6524.36583 C163.902564,6524.77071 163.902564,6525.42619 164.292308,6525.83004 L172.555873,6534.39267 C173.33636,6535.20244 174.602528,6535.20244 175.383014,6534.39267 L183.70754,6525.76791 C184.093286,6525.36716 184.098283,6524.71997 183.717533,6524.31405 C183.328789,6523.89985 182.68821,6523.89467 182.29347,6524.30266 L174.676479,6532.19636 C174.285736,6532.60124 173.653152,6532.60124 173.262409,6532.19636 L165.705379,6524.36583 C165.315635,6523.96094 164.683051,6523.96094 164.292308,6524.36583" id="arrow_down-[#1e2c4c]"></path></g></g></g></g></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="column-2">
                    <div className="div-39">
                      <div className="div-40" onClick={() => handleViewChange('presentaLotto')} >Crea Lotto</div>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'utentiCaricati' && (
                <div className="div-28">
                  <div className="column">
                    <div className="div-29">
                      <div className="div-30">Utenti</div>
                    </div>
                    <div className="div-31">
                      <table className="aste-table">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {utenti.map((utente, index) => (
                            <tr key={index}>
                              <td>{utente.nome}</td>
                              <td>{utente.email}</td>
                              <td>
                                <button onClick={() => handleEdit(utente.id, 'utenti')}>
                                  <svg fill="#073b4c" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#073b4c" className="icon glyph"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M8.661,19.113,3,21l1.887-5.661ZM20.386,7.388a2.1,2.1,0,0,0,0-2.965l-.809-.809a2.1,2.1,0,0,0-2.965,0L6.571,13.655l3.774,3.774Z"></path></g></svg>
                                </button>
                                <button onClick={() => handleDelete(utente.id, 'utenti')}>
                                  <svg fill="#065a74" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#065a74" className="icon glyph"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M17,4V5H15V4H9V5H7V4A2,2,0,0,1,9,2h6A2,2,0,0,1,17,4Z"></path><path d="M20,6H4A1,1,0,0,0,4,8H5V20a2,2,0,0,0,2,2H17a2,2,0,0,0,2-2V8h1a1,1,0,0,0,0-2ZM11,17a1,1,0,0,1-2,0V11a1,1,0,0,1,2,0Zm4,0a1,1,0,0,1-2,0V11a1,1,0,0,1,2,0Z"></path></g></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'presentaAsta' && (
                <div className="div-28">
                  {loading ? <div>Caricamento in corso...</div> : (
                    <form onSubmit={(e) => handleSubmit(e, 'asta')}>
                      <div className="column">
                        <label className="text">Nome:</label>
                        <input type="text" className='ccc' name="nome" />
                        <label className="text">Descrizione:</label>
                        <textarea className='cc' name="descrizione" />
                        <label className="text">Categoria:</label>
                        <select className='ccc' name="categoria" onChange={handleAuctionCategoryChange}>
                          <option value="">Seleziona categoria</option>
                          <option value="a tempo">A tempo</option>
                          <option value="live">Live</option>
                        </select>
                        {auctionCategory === 'a tempo' && (
                          <>
                            <label className="text">Ore:</label>
                            <input type="number" className='ccc' name="ore" value={hours} onChange={handleHoursChange} />
                          </>
                        )}
                        <label className="text">Copertina:</label>
                        <input className='ccc' type="file" onChange={handleImagesChange} accept="image/*" multiple />
                        <label className="text">Data Inizio:</label>
                        <input className='ccc' type="date" name="dataInizio" />
                        <label className="text">Data Fine:</label>
                        <input className='ccc' type="date" name="dataFine" />
                        <button className="div-40" type="submit">Salva Asta</button>
                      </div>
                    </form>
                  )}
                  {error && <div style={{ color: 'red' }}>{error}</div>}
                </div>
              )}

              {currentView === 'modificaAsta' && (
                <div className="div-28">
                  {loading ? <div>Caricamento in corso...</div> : (
                    <form onSubmit={(e) => handleUpdate(e, 'asta')}>
                      <div className="column">
                        <label className="text">Nome:</label>
                        <input type="text" className='ccc' name="nome" value={currentAsta?.nome || ''} onChange={(e) => handleChange(e, 'asta')} />
                        <label className="text">Descrizione:</label>
                        <textarea className='cc' name="descrizione" value={currentAsta?.descrizione || ''} onChange={(e) => handleChange(e, 'asta')} />
                        <label className="text">Categoria:</label>
                        <select className='ccc' name="categoria" value={auctionCategory} onChange={handleAuctionCategoryChange}>
                          <option value="">Seleziona categoria</option>
                          <option value="a tempo">A tempo</option>
                          <option value="live">Live</option>
                        </select>
                        {auctionCategory === 'a tempo' && (
                          <>
                            <label className="text">Ore:</label>
                            <input type="number" className='ccc' name="ore" value={hours} onChange={handleHoursChange} />
                          </>
                        )}
                        <label className="text">Copertina:</label>
                        <input className='ccc' type="file" onChange={handleImagesChange} accept="image/*" multiple />
                        <label className="text">Data Inizio:</label>
                        <input className='ccc' type="date" name="dataInizio" value={currentAsta?.dataInizio || ''} onChange={(e) => handleChange(e, 'asta')} />
                        <label className="text">Data Fine:</label>
                        <input className='ccc' type="date" name="dataFine" value={currentAsta?.dataFine || ''} onChange={(e) => handleChange(e, 'asta')} />
                        <button className="div-40" type="submit">Aggiorna Asta</button>
                      </div>
                    </form>
                  )}
                  {error && <div style={{ color: 'red' }}>{error}</div>}
                </div>
              )}

              {currentView === 'presentaLotto' && (
                <div className="div-28">
                  {loading ? <div>Caricamento in corso...</div> : (
                    <form onSubmit={(e) => handleSubmit(e, 'lotti')}>
                      <div className="column">
                        <label className="text">Nome:</label>
                        <input type="text" className='ccc' name="nome" />
                        <label className="text">Descrizione:</label>
                        <textarea className='cc' name="descrizione" />
                        <label className="text">Copertina:</label>
                        <input className='ccc' type="file" onChange={handleImagesChange} accept="image/*" multiple />
                        <label className="text">Asta:</label>
                        <select className='ccc' name="asta">
                          {aste.map((asta) => (
                            <option key={asta.id} value={asta.nome}>{asta.nome}</option>
                          ))}
                        </select>
                        <label className="text">Categoria:</label>
                        <select className='ccc' name="categoria">
                          {categories.map((category, index) => (
                            <option key={index} value={category}>{category}</option>
                          ))}
                        </select>
                        <label className="text">Datazione:</label>
                        <input type="text" className='ccc' name="datazione" />
                        <label className="text">Stima:</label>
                        <input type="number" className='ccc' name="stima" />
                        <label className="text">Prezzo Iniziale:</label>
                        <input type="number" className='ccc' name="prezzoIniziale" />
                        <label className="text">Prezzo Attuale:</label>
                        <input type="number" className='ccc' name="prezzoAttuale" />
                        <label className="text">Prezzo di Riserva:</label>
                        <input type="number" className='ccc' name="prezzoRiserva" />
                        <label className="text">Dimensioni:</label>
                        <input type="text" className='ccc' name="dimensioni" />
                        <button className="div-40" type="submit">Salva Lotto</button>
                      </div>
                    </form>
                  )}
                  {error && <div style={{ color: 'red' }}>{error}</div>}
                </div>
              )}

              {currentView === 'modificaLotto' && (
                <div className="div-28">
                  {loading ? <div>Caricamento in corso...</div> : (
                    <form onSubmit={(e) => handleUpdate(e, 'lotti')}>
                      <div className="column">
                        <label className="text">Nome:</label>
                        <input type="text" className='ccc' name="nome" value={currentLotto?.nome || ''} onChange={(e) => handleChange(e, 'lotti')} />
                        <label className="text">Descrizione:</label>
                        <textarea className='cc' name="descrizione" value={currentLotto?.descrizione || ''} onChange={(e) => handleChange(e, 'lotti')} />
                        <label className="text">Copertina:</label>
                        <input className='ccc' type="file" onChange={handleImagesChange} accept="image/*" multiple />
                        <label className="text">Asta:</label>
                        <select className='ccc' name="asta" value={currentLotto?.asta || ''} onChange={(e) => handleChange(e, 'lotti')}>
                          {aste.map((asta) => (
                            <option key={asta.id} value={asta.nome}>{asta.nome}</option>
                          ))}
                        </select>
                        <label className="text">Categoria:</label>
                        <select className='ccc' name="categoria" value={currentLotto?.categoria || ''} onChange={(e) => handleChange(e, 'lotti')}>
                          {categories.map((category, index) => (
                            <option key={index} value={category}>{category}</option>
                          ))}
                        </select>
                        <label className="text">Datazione:</label>
                        <input type="text" className='ccc' name="datazione" value={currentLotto?.datazione || ''} onChange={(e) => handleChange(e, 'lotti')} />
                        <label className="text">Stima:</label>
                        <input type="number" className='ccc' name="stima" value={currentLotto?.stima || ''} onChange={(e) => handleChange(e, 'lotti')} />
                        <label className="text">Prezzo Iniziale:</label>
                        <input type="number" className='ccc' name="prezzoIniziale" value={currentLotto?.prezzoIniziale || ''} onChange={(e) => handleChange(e, 'lotti')} />
                        <label className="text">Prezzo Attuale:</label>
                        <input type="number" className='ccc' name="prezzoAttuale" value={currentLotto?.prezzoAttuale || ''} onChange={(e) => handleChange(e, 'lotti')} />
                        <label className="text">Prezzo di Riserva:</label>
                        <input type="number" className='ccc' name="prezzoRiserva" value={currentLotto?.prezzoRiserva || ''} onChange={(e) => handleChange(e, 'lotti')} />
                        <label className="text">Dimensioni:</label>
                        <input type="text" className='ccc' name="dimensioni" value={currentLotto?.dimensioni || ''} onChange={(e) => handleChange(e, 'lotti')} />
                        <button className="div-40" type="submit">Aggiorna Lotto</button>
                      </div>
                    </form>
                  )}
                  {error && <div style={{ color: 'red' }}>{error}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
