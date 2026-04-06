import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { favoriService } from '../api/api';

const FavoritesScreen = ({ user, onBack, onIlanClick }) => {
    const [ilanlar, setIlanlar] = useState([]);
    const [loading, setLoading] = useState(true);

    const favorileriGetir = async () => {
        // GÜVENLİK ÖNLEMİ: User yoksa veya ID'si yoksa istek atma
        if (!user || !user.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await favoriService.getMyFavoriler(user.id);
            setIlanlar(data);
        } catch (error) {
            console.error("Favori liste hatası:", error);
            // Hata olsa bile loading'i kapat ki sonsuz dönmesin
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            favorileriGetir();
        }, [user])
    );

    // HIZLI FAVORİDEN ÇIKARMA
    const handleRemoveFavorite = async (ilanId) => {
        Alert.alert(
            "Favorilerden Kaldır",
            "Bu ilanı favorilerinizden çıkarmak istiyor musunuz?",
            [
                { text: "Vazgeç", style: "cancel" },
                { 
                    text: "Çıkar", 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await favoriService.toggleFavori(user.id, ilanId);
                            setIlanlar(currentIlanlar => currentIlanlar.filter(item => item.id !== ilanId));
                        } catch (error) {
                            Alert.alert("Hata", "İşlem gerçekleştirilemedi.");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => {
        const logoSource = item.logoBase64 
            ? { uri: `data:image/jpeg;base64,${item.logoBase64}` }
            : null;

        return (
            <TouchableOpacity style={styles.card} onPress={() => onIlanClick(item.id)}>
                <View style={styles.cardHeader}>
                    <View style={styles.logoContainer}>
                        {logoSource ? (
                            <Image source={logoSource} style={styles.logo} />
                        ) : (
                            <Text style={{fontSize: 24}}>🏢</Text>
                        )}
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.title}>{item.baslik}</Text>
                        <Text style={styles.company}>{item.sirketAdi}</Text>
                    </View>
                    
                    <TouchableOpacity 
                        onPress={() => handleRemoveFavorite(item.id)} 
                        style={{padding: 5}}
                    >
                        <Ionicons name="heart" size={28} color="#ef4444" />
                    </TouchableOpacity>

                </View>
                <View style={styles.tagsContainer}>
                    <View style={styles.tag}><Text style={styles.tagText}>📍 {item.sehir}</Text></View>
                    {item.maas && (<View style={styles.tag}><Text style={styles.tagText}>💰 {item.maas}</Text></View>)}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Favorilerim</Text>
                <View style={{width: 30}} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6366f1" style={{marginTop: 50}} />
            ) : (
                <FlatList
                    data={ilanlar}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="heart-dislike-outline" size={60} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Henüz favori ilanınız yok.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    iconButton: { padding: 5 },
    listContent: { padding: 20 },
    
    card: { backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    logoContainer: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#e2e8f0' },
    logo: { width: '100%', height: '100%', borderRadius: 10, resizeMode: 'cover' },
    title: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    company: { fontSize: 14, color: '#64748b' },
    tagsContainer: { flexDirection: 'row', gap: 10 },
    tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    tagText: { fontSize: 12, color: '#475569', fontWeight: '600' },
    
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 10, color: '#94a3b8', fontSize: 16 }
});

export default FavoritesScreen;