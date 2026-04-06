import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { aiService } from '../api/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 60; // Butonun çapı

const AIChatButton = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Merhaba! 👋 Ben Kariyer Asistanın. Sana nasıl yardımcı olabilirim?", sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef();

    // --- KONUM TAKİBİ VE SINIRLAMA ---
    
    // Başlangıç: Sağ alt köşe (Güvenli bölge)
    const initialPosition = {
        x: SCREEN_WIDTH - BUTTON_SIZE - 20, 
        y: SCREEN_HEIGHT - 150 // TabBar'ın üstünde kalsın
    };

    const pan = useRef(new Animated.ValueXY(initialPosition)).current;
    
    // Animated değerini anlık okumak için listener (Önemli!)
    const val = useRef(initialPosition);
    
    useEffect(() => {
        const listener = pan.addListener((value) => {
            val.current = value;
        });
        return () => pan.removeListener(listener);
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: val.current.x,
                    y: val.current.y
                });
                pan.setValue({ x: 0, y: 0 });
            },

            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),

            onPanResponderRelease: (e, gestureState) => {
                pan.flattenOffset(); // Mevcut konumu sabitle

                // --- SINIR KONTROLÜ (BOUNDARY CHECK) ---
                // Butonun şu anki koordinatlarını al
                let currentX = val.current.x;
                let currentY = val.current.y;
                
                let newX = currentX;
                let newY = currentY;

                // 1. SOL VE SAĞ SINIR
                // Ekranın solundan dışarı çıkmasın (0)
                if (currentX < 0) newX = 5; 
                // Ekranın sağından dışarı çıkmasın (Genişlik - Buton Boyutu)
                else if (currentX > SCREEN_WIDTH - BUTTON_SIZE) newX = SCREEN_WIDTH - BUTTON_SIZE - 5;

                // 2. ÜST VE ALT SINIR
                // En tepeye gitmesin (Header payı)
                if (currentY < 50) newY = 55;
                // En alta gitmesin (TabBar ve Navigasyon payı - Önemli!)
                // Burayı 100-150 arası tutuyoruz ki alttaki menüye girmesin.
                else if (currentY > SCREEN_HEIGHT - 120) newY = SCREEN_HEIGHT - 125;

                // Eğer sınır dışındaysa animasyonla içeri al
                if (newX !== currentX || newY !== currentY) {
                    Animated.spring(pan, {
                        toValue: { x: newX, y: newY },
                        useNativeDriver: false,
                        friction: 5 // Yaylanma efekti
                    }).start();
                }

                // --- TIKLAMA MI SÜRÜKLEME Mİ? ---
                // Eğer parmak çok az hareket ettiyse (5px'den az), bunu tıklama say.
                if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
                    setModalVisible(true);
                }
            }
        })
    ).current;

    // --- SOHBET FONKSİYONLARI ---
    const handleSend = async () => {
        if (!inputText.trim()) return;
        const userMsg = inputText.trim();
        setInputText(""); 
        Keyboard.dismiss();

        const newMessages = [...messages, { id: Date.now(), text: userMsg, sender: 'user' }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const response = await aiService.genelSohbet(userMsg);
            const aiResponseText = response.cevap || "Şu an cevap veremiyorum.";
            setMessages(prev => [...prev, { id: Date.now() + 1, text: aiResponseText, sender: 'ai' }]);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Bağlantı hatası oluştu. 😔", sender: 'ai' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    pan.getLayout(),
                    styles.floatingButton
                ]}
            >
                <View style={styles.innerButton}>
                    <Ionicons name="chatbubble-ellipses-outline" size={28} color="white" />
                </View>
            </Animated.View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <View style={{flexDirection:'row', alignItems:'center'}}>
                                <View style={styles.aiAvatar}>
                                    <Ionicons name="sparkles" size={16} color="white" />
                                </View>
                                <Text style={styles.headerTitle}>Kariyer Asistanı</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{padding:5}}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.messagesContainer}
                            ref={scrollViewRef}
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        >
                            {messages.map((msg) => (
                                <View key={msg.id} style={[
                                    styles.messageBubble, 
                                    msg.sender === 'user' ? styles.userBubble : styles.aiBubble
                                ]}>
                                    <Text style={[
                                        styles.messageText,
                                        msg.sender === 'user' ? styles.userText : styles.aiText
                                    ]}>{msg.text}</Text>
                                </View>
                            ))}
                            {loading && (
                                <View style={[styles.messageBubble, styles.aiBubble, {width: 60, alignItems:'center'}]}>
                                    <ActivityIndicator size="small" color="#1e293b" />
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Bir şeyler sor..."
                                value={inputText}
                                onChangeText={setInputText}
                                returnKeyType="send"
                                onSubmitEditing={handleSend}
                                placeholderTextColor="#94a3b8"
                            />
                            <TouchableOpacity 
                                style={[styles.sendButton, !inputText.trim() && {backgroundColor:'#cbd5e1'}]} 
                                onPress={handleSend}
                                disabled={!inputText.trim() || loading}
                            >
                                <Ionicons name="send" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        zIndex: 9999,
        // Artık bottom/right yok, Animated.View yönetiyor
    },
    innerButton: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        backgroundColor: '#f1f5f9',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '75%',
        paddingBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#e2e8f0',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    messagesContainer: {
        flex: 1,
        padding: 15,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        maxWidth: '85%',
    },
    aiBubble: {
        backgroundColor: 'white',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginLeft: 5
    },
    userBubble: {
        backgroundColor: '#1e293b',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2,
        marginRight: 5
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    aiText: { color: '#334155' },
    userText: { color: 'white' },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'white',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#e2e8f0'
    },
    input: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 10,
        color: '#334155',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 44
    },
    sendButton: {
        backgroundColor: '#1e293b',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default AIChatButton;