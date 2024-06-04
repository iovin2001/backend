import React, { useState, useEffect } from 'react';
import './homepage.css';
import './styles.css'; // Importa lo stile per il footer
import { useLocation, useNavigate } from 'react-router-dom';
import { db, storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { slide as Menu } from 'react-burger-menu';
import { useMediaQuery } from 'react-responsive';
import { Footer } from './Footer'; // Importa il componente Footer

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsta, setFilterAsta] = useState('');
  const [sortOrder, setSortOrder] = useState('relevance');
  const [bulkAction, setBulkAction] = useState('');

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

  const handleSubmit = async (e, collectionName) => {
    e.preventDefault();
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
        nome: e.target.nome.value,
        descrizione: e.target.descrizione.value,
        imageUrls: imageUrls,
        categoria: e.target.categoria.value
      };

      if (collectionName === "asta") {
        data.dataInizio = e.target.dataInizio.value;
        data.dataFine = e.target.dataFine.value;
        if (data.categoria === "a tempo") {
          data.ore = e.target.ore.value;
        }
        await setDoc(doc(db, collectionName, data.nome), data);
      } else if (collectionName === "lotti") {
        data.asta = e.target.asta.value;
        data.categoria = e.target.categoria.value;
        data.datazione = e.target.datazione.value;
        data.stima = e.target.stima.value;
        data.prezzoIniziale = e.target.prezzoIniziale.value;
        data.prezzoAttuale = e.target.prezzoAttuale.value;
        data.prezzoRiserva = e.target.prezzoRiserva.value;
        data.dimensioni = e.target.dimensioni.value;
        await setDoc(doc(db, collectionName, data.nome), data);
      }

      setImages([]);
      e.target.reset();
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

  const handleBulkAction = async () => {
    if (bulkAction === "elimina") {
      await handleBulkDelete();
    } else if (bulkAction === "archivia") {
      await handleBulkArchive();
    }
  };

  const handleBulkDelete = async () => {
    try {
      const batchDelete = selectedItems.map(id => deleteDoc(doc(db, "lotti", id)));
      await Promise.all(batchDelete);
      fetchLotti();
      setSelectedItems([]);
    } catch (error) {
      console.error("Errore nella cancellazione: ", error);
    }
  };

  const handleBulkArchive = async () => {
    try {
      const batchArchive = selectedItems.map(id => updateDoc(doc(db, "lotti", id), { archiviate: true }));
      await Promise.all(batchArchive);
      fetchLotti();
      setSelectedItems([]);
    } catch (error) {
      console.error("Errore nell'archiviazione: ", error);
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

  const handleUpdate = async (e, collectionName) => {
    e.preventDefault();
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
          categoria: currentAsta.categoria,
          ore: currentAsta.categoria === "a tempo" ? currentAsta.ore : undefined,
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
    const { name, value } = e.target;
    if (collectionName === "asta") {
      setCurrentAsta({ ...currentAsta, [name]: value });
    } else if (collectionName === "lotti") {
      setCurrentLotto({ ...currentLotto, [name]: value });
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterAstaChange = (e) => {
    setFilterAsta(e.target.value);
  };

  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
  };

  const filteredAste = aste.filter(asta => 
    asta.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(asta =>
    !filterAsta || asta.nome === filterAsta
  ).sort((a, b) => {
    if (sortOrder === 'name') {
      return a.nome.localeCompare(b.nome);
    } else if (sortOrder === 'startDate') {
      return new Date(a.dataInizio) - new Date(b.dataInizio);
    } else {
      return 0;
    }
  });

  const filteredLotti = lotti.filter(lotto => 
    lotto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(lotto =>
    !filterAsta || lotto.asta === filterAsta
  ).sort((a, b) => {
    if (sortOrder === 'name') {
      return a.nome.localeCompare(b.nome);
    } else if (sortOrder === 'initialPrice') {
      return a.prezzoIniziale - b.prezzoIniziale;
    } else {
      return 0;
    }
  });

  return (
    <div className="div">
      {isMobile && (
        <Menu>
          <div className="div-1x">
            <span className="ciao">Ciao, </span><span className="user">{user}</span>
          </div>
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
              <div className="div-1x">
                <span className="ciao">Ciao, </span><span className="user">{user}</span>
              </div>
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
                <>
                  <div className="div-29">
                    <div className="div-30">Aste Presentate</div>
                  </div>
                  <div className="div-28">
                    <div className="column">
                      <div className="filters-container">
                        <div className="filters">
                          <div className="div-29">
                            <div className="div-30">{aste.length} aste caricate</div>
                          </div>
                          <div className="filter-item">
                            <label>Cerca</label>
                            <div className="custom-input-container">
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z" stroke="#1E2C4C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M17.5 17.5L13.875 13.875" stroke="#1E2C4C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                              </svg>
                              <input type="text" placeholder="Cosa cerchi?" className="custom-input" value={searchTerm} onChange={handleSearchChange} />
                            </div>
                            <div className="underline"></div>
                          </div>
                          <div className="filter-item">
                            <label>Filtra per categoria</label>
                            <select className="ccc select-with-svg" value={filterAsta} onChange={handleFilterAstaChange}>
                              <option className="option-transparent" value="">Categoria</option>
                              <option className="option-transparent" value="a tempo">A tempo</option>
                              <option className="option-transparent" value="live">Live</option>
                            </select>
                          </div>
                          <div className="filter-item">
                            <label>Ordina per</label>
                            <select className="ccc select-with-svg" value={sortOrder} onChange={handleSortOrderChange}>
                              <option className="option-transparent" value="relevance">Rilevanza</option>
                              <option className="option-transparent" value="data">Data</option>
                              <option className="option-transparent" value="nome">Nome</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="column">
                        <div className="bulk-action-container">
                          <select className="ccc1 select-with-svg" name="actions" value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
                            <option className="option-transparent" value="">Azioni</option>
                            <option className="option-transparent" value="elimina">Elimina</option>
                            <option className="option-transparent" value="archivia">Archivia</option>
                          </select>
                          <button className="div-40x" onClick={handleBulkAction}>Applica</button>
                        </div>
                        <div className="div-31">
                          <table className="aste-table">
                            <thead>
                              <tr className='tr'>
                                <th><input type="checkbox" onChange={() => handleSelectAll(aste)} /></th>
                                <th>Copertina</th>
                                <th>Nome</th>
                                <th>Descrizione</th>
                                <th>Data Inizio</th>
                                <th>Data Fine</th>
                                <th>Azioni</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAste.map((asta, index) => (
                                <tr key={index}>
                                  <td><input type="checkbox" checked={selectedItems.includes(asta.id)} onChange={() => handleSelect(asta.id)} /></td>
                                  <td><img src={asta.imageUrls ? asta.imageUrls[0] : ''} alt={asta.nome} className="copertina-img" /></td>
                                  <td>{asta.nome}</td>
                                  <td>{asta.descrizione}</td>
                                  <td>{asta.dataInizio}</td>
                                  <td>{asta.dataFine}</td>
                                  <td>
                                    <select className="ccc1 select-with-svg" name="actions" onChange={(e) => {
                                      if (e.target.value === 'elimina') {
                                        handleDelete(asta.id, 'asta');
                                      } else if (e.target.value === 'modifica') {
                                        handleEdit(asta.id, 'asta');
                                      }
                                    }}>
                                      <option className="option-transparent" value="">Azioni</option>
                                      <option className="option-transparent" value="elimina">Elimina</option>
                                      <option className="option-transparent" value="modifica">Modifica</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    <div className="column-2">
                      <div className="div-39">
                        <div className="div-40" onClick={() => handleViewChange('presentaAsta')}>Presenta asta</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {currentView === 'lottiCaricati' && (
                <>
                  <div className="div-29">
                    <div className="div-30">Lotti Presentati</div>
                  </div>
                  <div className="div-28">
                    <div className="column">
                      <div className="filters-container">
                        <div className="filters">
                          <div className="div-29">
                            <div className="div-30">{lotti.length} lotti caricati</div>
                          </div>
                          <div className="filter-item">
                            <label>Cerca</label>
                            <div className="custom-input-container">
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z" stroke="#1E2C4C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M17.5 17.5L13.875 13.875" stroke="#1E2C4C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                              </svg>
                              <input type="text" placeholder="Cosa cerchi?" className="custom-input" value={searchTerm} onChange={handleSearchChange} />
                            </div>
                            <div className="underline"></div>
                          </div>
                          <div className="filter-item">
                            <label>Filtra per asta</label>
                            <select className="ccc select-with-svg" name="asta" value={filterAsta} onChange={handleFilterAstaChange}>
                              <option className="option-transparent" value="">Seleziona un'asta</option>
                              {aste.map((asta) => (
                                <option key={asta.id} value={asta.nome} className="option-transparent">{asta.nome}</option>
                              ))}
                            </select>
                          </div>
                          <div className="filter-item">
                            <label>Ordina per</label>
                            <select className="ccc select-with-svg" name="asta" value={sortOrder} onChange={handleSortOrderChange}>
                              <option className="option-transparent" value="rilevanza">Rilevanza</option>
                              <option className="option-transparent" value="prezzo">Prezzo</option>
                              <option className="option-transparent" value="data">Data</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="bulk-action-container">
                        <select className="ccc1 select-with-svg" name="actions" value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
                          <option className="option-transparent" value="">Azioni</option>
                          <option className="option-transparent" value="elimina">Elimina</option>
                          <option className="option-transparent" value="archivia">Archivia</option>
                        </select>
                        <button className="div-40x" onClick={handleBulkAction}>Applica</button>
                      </div>
                      <div className="div-31">
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
                            {filteredLotti.map((lotto, index) => (
                              <tr key={index}>
                                <td><input type="checkbox" checked={selectedItems.includes(lotto.id)} onChange={() => handleSelect(lotto.id)} /></td>
                                <td><img src={lotto.imageUrls ? lotto.imageUrls[0] : ''} alt={lotto.nome} className="copertina-img" /></td>
                                <td>{lotto.nome}</td>
                                <td>{lotto.categoria}</td>
                                <td>{lotto.prezzoIniziale}</td>
                                <td>
                                  <select className="ccc1 select-with-svg" name="actions" onChange={(e) => {
                                    if (e.target.value === 'elimina') {
                                      handleDelete(lotto.id, 'lotti');
                                    } else if (e.target.value === 'modifica') {
                                      handleEdit(lotto.id, 'lotti');
                                    }
                                  }}>
                                    <option className="option-transparent" value="">Azioni</option>
                                    <option className="option-transparent" value="elimina">Elimina</option>
                                    <option className="option-transparent" value="modifica">Modifica</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="column-2">
                      <div className="div-39">
                        <div className="div-40" onClick={() => handleViewChange('presentaLotto')}>Presenta Lotto</div>
                      </div>
                    </div>
                  </div>
                </>
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
                                <select className="ccc select-with-svg" name="actions" onChange={(e) => {
                                  if (e.target.value === 'elimina') {
                                    handleDelete(utente.id, 'utenti');
                                  } else if (e.target.value === 'modifica') {
                                    handleEdit(utente.id, 'utenti');
                                  }
                                }}>
                                  <option className="option-transparent" value="">Azioni</option>
                                  <option className="option-transparent" value="elimina">Elimina</option>
                                  <option className="option-transparent" value="modifica">Modifica</option>
                                </select>
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
                        <label className="text">Copertina:</label>
                        <input className='ccc' type="file" onChange={handleImagesChange} accept="image/*" multiple />
                        <label className="text">Categoria:</label>
                        <select className='ccc' name="categoria">
                          <option value="a tempo">A tempo</option>
                          <option value="live">Live</option>
                        </select>
                        <label className="text">Data Inizio:</label>
                        <input className='ccc' type="date" name="dataInizio" />
                        <label className="text">Data Fine:</label>
                        <input className='ccc' type="date" name="dataFine" />
                        <label className="text">Ore:</label>
                        <input className='ccc' type="number" name="ore" />
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
                        <label className="text">Copertina:</label>
                        <input className='ccc' type="file" onChange={handleImagesChange} accept="image/*" multiple />
                        <label className="text">Categoria:</label>
                        <select className='ccc' name="categoria" value={currentAsta?.categoria || ''} onChange={(e) => handleChange(e, 'asta')}>
                          <option value="a tempo">A tempo</option>
                          <option value="live">Live</option>
                        </select>
                        <label className="text">Data Inizio:</label>
                        <input className='ccc' type="date" name="dataInizio" value={currentAsta?.dataInizio || ''} onChange={(e) => handleChange(e, 'asta')} />
                        <label className="text">Data Fine:</label>
                        <input className='ccc' type="date" name="dataFine" value={currentAsta?.dataFine || ''} onChange={(e) => handleChange(e, 'asta')} />
                        {currentAsta?.categoria === 'a tempo' && (
                          <>
                            <label className="text">Ore:</label>
                            <input className='ccc' type="number" name="ore" value={currentAsta?.ore || ''} onChange={(e) => handleChange(e, 'asta')} />
                          </>
                        )}
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
      <Footer mobile={isMobile ? "footer-mobile" : "footer-desktop"} />
    </div>
  );
};

export default HomePage;
