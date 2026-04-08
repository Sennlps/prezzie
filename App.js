import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import {
  ActivityIndicator,
  Animated,
  Clipboard,
  Easing,
  FlatList,
  Image,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './supabase';

const Stack = createNativeStackNavigator();

const RUBY_RED = '#D1001C';

const STRINGS = {
  nl: {
    appName: 'Prezzie',
    login: 'Inloggen',
    register: 'Registreren',
    email: 'E-mailadres',
    password: 'Wachtwoord',
    noAccount: 'Nog geen account? Registreer hier',
    haveAccount: 'Heb je al een account? Ga naar inloggen',
    homeTitle: 'Welkom bij Prezzie',
    homeSub: 'Wij helpen cadeaus zoeken op basis van interesses, budget en gelegenheid.',
    findForSomeone: 'Zoek cadeau voor iemand',
    findForMe: 'Zoek cadeau voor mijzelf',
    settings: 'Instellingen',
    invite: 'Nodig uit',
    wishlist: 'Mijn verlanglijst',
    profile: 'Profiel',
    results: 'Resultaten',
    survey: 'Vragenlijst',
    logout: 'Uitloggen',
    darkMode: 'Donkere modus',
    language: 'Taal',
  },
  en: {
    appName: 'Prezzie',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    noAccount: 'No account yet? Register',
    haveAccount: 'Already have an account? Go to login',
    homeTitle: 'Welcome to Prezzie',
    homeSub: 'We help find gifts based on interests, budget and occasion.',
    findForSomeone: 'Find gift for someone',
    findForMe: 'Find gift for myself',
    settings: 'Settings',
    invite: 'Invite',
    wishlist: 'My wishlist',
    profile: 'Profile',
    results: 'Results',
    survey: 'Gift Wizard',
    logout: 'Logout',
    darkMode: 'Dark mode',
    language: 'Language',
  },
};

const WIE_OPTIES = [
  'Partner',
  'Vriend',
  'Vriendin',
  'Familie',
  'Collega',
  'Kind',
  'Ouder',
  'Buur',
  'Docent',
];

const HOBBIES = [
  'Alcohol',
  'Basketballen',
  'Voetbal',
  'Gaming',
  'Fitness',
  'Hardlopen',
  'Padel',
  'Tennis',
  'Koken',
  'Bakken',
  'Koffie',
  'Muziek',
  'Gitaar',
  'Piano',
  'Vinyl',
  'Films',
  'Series',
  'Boeken',
  'Reizen',
  'Fotografie',
  'Tekenen',
  'Schilderen',
  'Tech',
  'Smart Home',
  'Auto',
  'Motor',
  'Vissen',
  'Kamperen',
  'Tuinieren',
  'Mode',
  'Beauty',
  'Duurzaamheid',
  'Bordspellen',
  'Lego',
  'Anime',
];

const BUDGET_OPTIONS = [
  { label: '€ 0-25', value: 25 },
  { label: '€ 25-50', value: 50 },
  { label: '€ 50-100', value: 100 },
  { label: '€ 100-250', value: 250 },
  { label: '€ 250+', value: 300 },
];

const HOBBY_SUBTYPES = {
  'Alcohol': ['Wijn', 'Sterk (Whisky/Gin)', 'Rum/Cognac', 'Bier', 'Cocktails', 'Alcohol-vrij'],
  'Basketballen': ['Schoenen', 'Bal', 'Kleding', 'Accessoires'],
  'Voetbal': ['Voetbalshirt', 'Voetbalschoenen', 'Bal', 'Kleding'],
  'Gaming': ['Console/PC', 'Spellen', 'Accessoires', 'VR/Tech'],
  'Fitness': ['Toestellen', 'Kleding', 'Voeding', 'Trackers'],
  'Hardlopen': ['Schoenen', 'Kleding', 'Smartwatch', 'Accessoires'],
  'Padel': ['Racket', 'Schoenen', 'Kleding', 'Bal'],
  'Tennis': ['Racket', 'Schoenen', 'Ballen', 'Kleding'],
  'Koken': ['Pannen/Bestek', 'Appliances', 'Ingrediënten', 'Kookboeken'],
  'Bakken': ['Vormen/Mallen', 'Mixer', 'Decoratie', 'Ingrediënten'],
  'Koffie': ['Grinder', 'Machine', 'Bonen', 'Accessoires'],
  'Muziek': ['Gitaar', 'Piano/Toetsen', 'Koptelefoon', 'Vinyl/Nummers'],
  'Fotografie': ['Camera', 'Lens', 'Tripod', 'Verlichting'],
  'Boeken': ['Fantasy', 'Mystery', 'Zelfhulp', 'Strips/Comics'],
  'Reizen': ['Koffer', 'Rugzak', 'Gadgets', 'Camping'],
  'Tech': ['Smartphone', 'Wearables', 'Smart Home', 'Accessoires'],
};

const budgetRangeLabel = (value) => {
  if (value <= 25) return '€ 0-25';
  if (value <= 50) return '€ 25-50';
  if (value <= 100) return '€ 50-100';
  if (value <= 250) return '€ 100-250';
  return '€ 250+';
};

const getTheme = (isDark) => ({
  bg: isDark ? '#121212' : '#FFFFFF',
  card: isDark ? '#1C1C1E' : '#FFFFFF',
  text: isDark ? '#F5F5F5' : '#1D1D1D',
  subText: isDark ? '#B8B8B8' : '#5C5C5C',
  border: isDark ? '#2B2B2D' : '#ECECEC',
  accent: RUBY_RED,
  chipBg: isDark ? '#252528' : '#F8F8F8',
});

const TIPS = [
  '💡 Je kan je app kleur zwart maken in instellingen',
  '🎁 Je kan meerdere interesses tegelijk kiezen',
  '💰 Stel je budget in naar je voorkeur',
  '❤️ Cadeaus opslaan op je verlanglijst',
  '👥 Deel je verlanglijst met vrienden',
  '🌙 Zet donkere modus aan voor comfortabel gebruik',
];

function SplashScreen({ theme }) {
  const [currentTip, setCurrentTip] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 3000);

    return () => clearInterval(tipInterval);
  }, [fadeAnim, scaleAnim]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.centerBox}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Text style={[styles.splashTitle, { color: theme.accent }]}>🎁</Text>
          <Text style={[styles.splashAppName, { color: theme.text }]}>Prezzie</Text>
          <Text style={[styles.splashSubtitle, { color: theme.subText }]}>
            Cadeaus zoeken gemaakt eenvoudig
          </Text>
        </Animated.View>

        <View style={styles.splashSpinner}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>

        <View style={styles.splashTipBox}>
          <Text style={[styles.splashTip, { color: theme.subText }]}>
            {TIPS[currentTip]}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}



function AppShell() {
  const [sessie, setSessie] = useState(null);
  const [initialiseren, setInitialiseren] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('nl');
  const [inviteFromUserId, setInviteFromUserId] = useState(null);

  const t = STRINGS[language] || STRINGS.nl;
  const theme = getTheme(darkMode);

  useEffect(() => {
    let actief = true;

    const laadSessie = async () => {
      const { data } = await supabase.auth.getSession();
      if (!actief) return;
      setSessie(data.session ?? null);
      setInitialiseren(false);
    };

    laadSessie();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nieuweSessie) => {
      setSessie(nieuweSessie ?? null);
    });

    return () => {
      actief = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle deep linking for invitations
  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      if (!url) return;
      
      try {
        const parsed = Linking.parse(url);
        const params = new URLSearchParams(parsed.queryParams || {});
        const fromUserId = params.get('from');
        
        if (fromUserId) {
          setInviteFromUserId(fromUserId);
        }
      } catch (error) {
        console.warn('Error parsing deep link:', error);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Also handle initial URL when app launches
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url != null) {
        handleDeepLink({ url });
      }
    };

    getInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const ensureProfile = async () => {
      if (!sessie?.user?.id) return;

      const metadata = sessie.user.user_metadata || {};
      const fullName = metadata.full_name || metadata.name || sessie.user.email?.split('@')[0] || null;

      await supabase.from('profiles').upsert(
        {
          id: sessie.user.id,
          email: sessie.user.email,
          full_name: fullName,
          avatar_url: metadata.avatar_url || metadata.picture || null,
        },
        { onConflict: 'id' }
      );
    };

    ensureProfile();
  }, [sessie?.user?.id]);

  if (initialiseren) {
    return <SplashScreen theme={theme} />;
  }

  return (
    <NavigationContainer>
      <StatusBar hidden />
      {sessie ? (
        <MainStack
          theme={theme}
          t={t}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          language={language}
          setLanguage={setLanguage}
        />
      ) : (
        <AuthStack theme={theme} t={t} inviteFromUserId={inviteFromUserId} />
      )}
    </NavigationContainer>
  );
}

function AuthStack({ theme, t, inviteFromUserId }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.accent,
        contentStyle: { backgroundColor: theme.bg },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Inloggen" options={{ headerShown: false }}>
        {(props) => <LoginScreen {...props} theme={theme} t={t} />}
      </Stack.Screen>
      <Stack.Screen name="Registreren" options={{ title: t.register }}>
        {(props) => <RegisterScreen {...props} theme={theme} t={t} inviteFromUserId={inviteFromUserId} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function LoginScreen({ navigation, theme, t }) {
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const inloggen = async () => {
    if (!email || !wachtwoord) {
      setFout('Vul je e-mailadres en wachtwoord in.');
      return;
    }

    setBezig(true);
    setFout('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: wachtwoord,
      });
      if (error) throw error;
    } catch (error) {
      const melding = error?.message || 'Inloggen mislukt.';
      if (melding.toLowerCase().includes('email not confirmed')) {
        setFout('Je e-mailadres is nog niet bevestigd. Open je bevestigingsmail.');
      } else {
        setFout(melding);
      }
    } finally {
      setBezig(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.authCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.appTitle, { color: theme.accent }]}>{t.appName}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{t.login}</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
          placeholderTextColor={theme.subText}
        />

        <TextInput
          value={wachtwoord}
          onChangeText={setWachtwoord}
          placeholder={t.password}
          secureTextEntry
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
          placeholderTextColor={theme.subText}
        />

        {fout ? <Text style={styles.errorText}>{fout}</Text> : null}

        <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={inloggen} disabled={bezig}>
          <Text style={styles.primaryButtonText}>{bezig ? 'Bezig...' : t.login}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Registreren')}>
          <Text style={[styles.linkText, { color: theme.accent }]}>{t.noAccount}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function RegisterScreen({ navigation, route, theme, t, inviteFromUserId }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');

  const registreren = async () => {
    if (!email || !wachtwoord || !fullName.trim()) {
      setFout('Vul alle velden in (e-mail, naam en wachtwoord).');
      return;
    }

    // Validate birthday
    if (!year || !month || !day) {
      setFout('Vul alle velden in: geboortedatum is verplicht.');
      return;
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2023) {
      setFout('Geboortejaar moet tussen 1900 en 2023 liggen.');
      return;
    }

    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12 || isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setFout('Voer een geldige geboortedatum in.');
      return;
    }

    setBezig(true);
    setFout('');
    setMelding('');

    try {
      const redirectUrl = Linking.createURL('auth/callback');
      const { error, data } = await supabase.auth.signUp({
        email: email.trim(),
        password: wachtwoord,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      if (error) throw error;

      // Create profile
      if (data?.user?.id) {
        const birthday = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const profileData = {
          id: data.user.id,
          email: email.trim(),
          full_name: fullName.trim(),
          birthday,
        };

        // Add invited_by if we have an inviting user from deep link
        if (inviteFromUserId) {
          profileData.invited_by = inviteFromUserId;
        }

        await supabase.from('profiles').insert(profileData);

        // Create bidirectional friendship if invited from deep link
        if (inviteFromUserId) {
          try {
            // Insert: new user -> inviting user
            await supabase.from('friends').insert({
              user_id: data.user.id,
              friend_id: inviteFromUserId,
            });

            // Insert: inviting user -> new user
            await supabase.from('friends').insert({
              user_id: inviteFromUserId,
              friend_id: data.user.id,
            });
            
            setMelding('Account aangemaakt! Je bent toegevoegd als vriend. Bevestig je e-mail en log in.');
          } catch (friendshipError) {
            console.warn('Could not create friendship:', friendshipError);
            // Don't fail if friendship creation fails
            setMelding('Account aangemaakt! Bevestig je e-mail en log daarna in.');
          }
        } else {
          setMelding('Account aangemaakt! Bevestig je e-mail en log daarna in.');
        }
      }
    } catch (error) {
      setFout(error.message || 'Registreren mislukt.');
    } finally {
      setBezig(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.authCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.appTitle, { color: theme.accent }]}>{t.appName}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{t.register}</Text>

        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Volledige naam"
          autoCapitalize="words"
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
          placeholderTextColor={theme.subText}
        />

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
          placeholderTextColor={theme.subText}
        />

        <TextInput
          value={wachtwoord}
          onChangeText={setWachtwoord}
          placeholder={t.password}
          secureTextEntry
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
          placeholderTextColor={theme.subText}
        />

        <Text style={[styles.formLabel, { color: theme.text }]}>Geboortedatum (verplicht)</Text>
        <View style={styles.birthdayInputRow}>
          <View style={styles.birthdayInputGroup}>
            <Text style={[styles.birthdayInputLabel, { color: theme.subText }]}>Jaar</Text>
            <TextInput
              value={year}
              onChangeText={setYear}
              placeholder="1995"
              keyboardType="number-pad"
              maxLength={4}
              style={[styles.birthdayInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
              placeholderTextColor={theme.subText}
            />
          </View>
          <View style={styles.birthdayInputGroup}>
            <Text style={[styles.birthdayInputLabel, { color: theme.subText }]}>Maand</Text>
            <TextInput
              value={month}
              onChangeText={setMonth}
              placeholder="01"
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.birthdayInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
              placeholderTextColor={theme.subText}
            />
          </View>
          <View style={styles.birthdayInputGroup}>
            <Text style={[styles.birthdayInputLabel, { color: theme.subText }]}>Dag</Text>
            <TextInput
              value={day}
              onChangeText={setDay}
              placeholder="01"
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.birthdayInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
              placeholderTextColor={theme.subText}
            />
          </View>
        </View>

        {fout ? <Text style={styles.errorText}>{fout}</Text> : null}
        {melding ? <Text style={styles.successText}>{melding}</Text> : null}

        <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={registreren} disabled={bezig}>
          <Text style={styles.primaryButtonText}>{bezig ? 'Bezig...' : t.register}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Inloggen')}>
          <Text style={[styles.linkText, { color: theme.accent }]}>{t.haveAccount}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function MainStack({ theme, t, darkMode, setDarkMode, language, setLanguage }) {
  const uitloggen = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.accent,
        headerShadowVisible: false,
        headerRight: () => (
          <Pressable onPress={uitloggen} style={styles.headerButton}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>{t.logout}</Text>
          </Pressable>
        ),
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="Home" options={{ headerShown: false }}>
        {(props) => <HomeScreen {...props} theme={theme} t={t} />}
      </Stack.Screen>
      <Stack.Screen name="Survey" options={{ title: t.survey }}>
        {(props) => <SurveyScreen {...props} theme={theme} t={t} />}
      </Stack.Screen>
      <Stack.Screen name="Resultaten" options={{ title: t.results }}>
        {(props) => <ResultatenScreen {...props} theme={theme} />}
      </Stack.Screen>
      <Stack.Screen name="Verlanglijst" options={{ title: t.wishlist }}>
        {(props) => <VerlanglijstScreen {...props} theme={theme} />}
      </Stack.Screen>
      <Stack.Screen name="Profiel" options={{ title: t.profile }}>
        {(props) => <ProfileScreen {...props} theme={theme} t={t} />}
      </Stack.Screen>
      <Stack.Screen name="Vrienden" options={{ headerShown: false }}>
        {(props) => <FriendenScreen {...props} theme={theme} t={t} />}
      </Stack.Screen>
      <Stack.Screen name="Instellingen" options={{ title: t.settings }}>
        {(props) => (
          <SettingsScreen
            {...props}
            theme={theme}
            t={t}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            language={language}
            setLanguage={setLanguage}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function CompactHeader({ navigation, theme, title, showProfile = false, onProfilePress }) {
  return (
    <View style={styles.compactHeader}>
      <Pressable onPress={() => navigation.goBack()} style={styles.compactHeaderBack}>
        <Text style={[styles.compactHeaderBackText, { color: theme.accent }]}>←</Text>
      </Pressable>
      <Text style={[styles.compactHeaderTitle, { color: theme.text }]}>{title}</Text>
      {showProfile ? (
        <Pressable onPress={onProfilePress} style={styles.profileTrigger}>
          <View style={[styles.profileThumbFallback, { borderColor: theme.border, backgroundColor: theme.card }]}> 
            <Text style={{ color: theme.accent, fontWeight: '800' }}>P</Text>
          </View>
        </Pressable>
      ) : (
        <View style={{ width: 46 }} />
      )}
    </View>
  );
}

function HomeScreen({ navigation, theme, t }) {
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [friendSearchMessage, setFriendSearchMessage] = useState('');
  const [idCopyMessage, setIdCopyMessage] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [friendSearching, setFriendSearching] = useState(false);
  const slideDrawer = useRef(new Animated.Value(280)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx }) => Math.abs(dx) > 10,
      onPanResponderRelease: (_, { vx, dx }) => {
        // Left swipe detected (dx < -50 or high velocity to the left)
        if (dx < -50 || vx < -0.5) {
          setProfileDrawerOpen(true);
        }
      },
    })
  ).current;

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    setProfile({ ...(data || {}), email: user.email, id: user.id });
  }, []);

  useEffect(() => {
    Animated.timing(slideDrawer, {
      toValue: profileDrawerOpen ? 0 : 280,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [profileDrawerOpen, slideDrawer]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Reload profile when coming back from ProfileScreen
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const copyIDToClipboard = async () => {
    if (!profile?.id) {
      setIdCopyMessage('Kan huidge gebruiker-ID niet laden.');
      setTimeout(() => setIdCopyMessage(''), 3000);
      return;
    }

    try {
      const shortId = profile.id.substring(0, 6).toUpperCase();
      await Clipboard.setString(shortId);
      setIdCopyMessage('ID gekopieerd naar klembord! ✅');
      setTimeout(() => setIdCopyMessage(''), 3000);
    } catch (error) {
      console.error('Copy error:', error);
      setIdCopyMessage('Kopiëren mislukt');
      setTimeout(() => setIdCopyMessage(''), 3000);
    }
  };

  const addFriendByID = async () => {
    if (!friendSearchInput.trim()) {
      setFriendSearchMessage('Voer een vriend-ID in.');
      setTimeout(() => setFriendSearchMessage(''), 3000);
      return;
    }

    setFriendSearching(true);
    setFriendSearchMessage('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFriendSearchMessage('Je bent niet ingelogd.');
        setFriendSearching(false);
        return;
      }

      // Search for user whose ID starts with the input (case-insensitive)
      const searchId = friendSearchInput.toLowerCase();
      const { data: allUsers, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1000);

      if (searchError) throw searchError;

      const matchedUser = allUsers?.find(u => 
        u.id.toLowerCase().startsWith(searchId)
      );

      if (!matchedUser) {
        setFriendSearchMessage('Gebruiker niet gevonden');
        setFriendSearching(false);
        return;
      }

      if (matchedUser.id === user.id) {
        setFriendSearchMessage('Je kunt jezelf niet als vriend toevoegen');
        setFriendSearching(false);
        return;
      }

      // Create bidirectional friendship
      try {
        await supabase.from('friends').insert({
          user_id: user.id,
          friend_id: matchedUser.id,
        });

        await supabase.from('friends').insert({
          user_id: matchedUser.id,
          friend_id: user.id,
        });

        setFriendSearchMessage('Vriend toegevoegd! 🎉');
        setFriendSearchInput('');
        setTimeout(() => {
          setFriendModalVisible(false);
          setFriendSearchMessage('');
        }, 2000);
      } catch (friendError) {
        // Check if friendship already exists
        if (friendError.message?.includes('duplicate')) {
          setFriendSearchMessage('Je bent al vrienden met deze persoon');
        } else {
          setFriendSearchMessage('Kon vriend niet toevoegen');
        }
      }
    } catch (error) {
      console.error('Friend search error:', error);
      setFriendSearchMessage('Fout bij zoeken naar vriend');
    } finally {
      setFriendSearching(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg, overflow: 'hidden' }]} {...panResponder.panHandlers}> 
      <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
        {/* Header Row */}
        <View style={styles.homeTopRow}>
          <Text style={[styles.appTitle, { color: theme.accent }]}>Prezzie</Text>
          <Pressable onPress={() => setProfileDrawerOpen(true)} style={[styles.profileTrigger, { borderColor: theme.border }]}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.profileThumb} />
            ) : (
              <View style={[styles.profileThumbFallback, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <Image source={require('./assets/profielicon.png')} style={{ width: 20, height: 20 }} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: theme.accent }]}>
          <Text style={styles.heroEmoji}>🎁</Text>
          <Text style={styles.heroTitle}>Vind het perfecte cadeau</Text>
          <Text style={styles.heroSubtitle}>In enkele stappen ontdek jij de ideale gift ideeën</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <Pressable
            onPress={() => navigation.navigate('Survey', { mode: 'voorIemand' })}
            style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={styles.actionEmoji}>🤝</Text>
            <Text style={[styles.actionTitle, { color: theme.text }]}>Voor iemand anders</Text>
            <Text style={[styles.actionDesc, { color: theme.subText }]}>Kies één interesse</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Survey', { mode: 'voorMij' })}
            style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={styles.actionEmoji}>😋</Text>
            <Text style={[styles.actionTitle, { color: theme.text }]}>Voor mezelf</Text>
            <Text style={[styles.actionDesc, { color: theme.subText }]}>Wat wil ik graag?</Text>
          </Pressable>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Hoe werkt het?</Text>
          
          <View style={[styles.featureItem, { borderLeftColor: theme.accent }]}>
            <Text style={styles.featureNumber}>1</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>Kies interesses</Text>
              <Text style={[styles.featureDesc, { color: theme.subText }]}>Waar houdt de persoon van?</Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderLeftColor: theme.accent }]}>
            <Text style={styles.featureNumber}>2</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>Stel je budget in</Text>
              <Text style={[styles.featureDesc, { color: theme.subText }]}>Hoeveel wil je uitgeven?</Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderLeftColor: theme.accent }]}>
            <Text style={styles.featureNumber}>3</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>Ontdek cadeaus</Text>
              <Text style={[styles.featureDesc, { color: theme.subText }]}>Sla je favorieten op</Text>
            </View>
          </View>
        </View>

        {/* Wishlist Card */}
        <Pressable
          onPress={() => navigation.navigate('Verlanglijst')}
          style={[styles.cardsCard, { backgroundColor: theme.card, borderColor: theme.accent, borderWidth: 2 }]}
        >
          <Text style={styles.cardEmoji}>💝</Text>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Mijn verlanglijst</Text>
            <Text style={[styles.cardDesc, { color: theme.subText }]}>Bekijk je opgeslagen cadeaus</Text>
          </View>
          <Text style={styles.cardArrow}>→</Text>
        </Pressable>

        {/* Invite Message */}
        {inviteMessage && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent, borderLeftWidth: 4 }]}>
            <Text style={[styles.cardText, { color: theme.accent }]}>{inviteMessage}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Pressable
          style={styles.bottomNavButton}
          onPress={() => navigation.navigate('Profiel')}
        >
          <Image source={require('./assets/profielicon.png')} style={styles.bottomNavIcon} />
          <Text style={[styles.bottomNavLabel, { color: theme.text }]}>Profiel</Text>
        </Pressable>
        <Pressable
          style={styles.bottomNavButton}
          onPress={() => setFriendModalVisible(true)}
        >
          <Image source={require('./assets/nodiguit.png')} style={styles.bottomNavIcon} />
          <Text style={[styles.bottomNavLabel, { color: theme.text }]}>Voeg vriend toe</Text>
        </Pressable>
        <Pressable
          style={styles.bottomNavButton}
          onPress={() => navigation.navigate('Vrienden')}
        >
          <Image source={require('./assets/vrienden.png')} style={styles.bottomNavIcon} />
          <Text style={[styles.bottomNavLabel, { color: theme.text }]}>Vrienden</Text>
        </Pressable>
        <Pressable
          style={styles.bottomNavButton}
          onPress={() => navigation.navigate('Instellingen')}
        >
          <Image source={require('./assets/instellingen.png')} style={styles.bottomNavIcon} />
          <Text style={[styles.bottomNavLabel, { color: theme.text }]}>Instellingen</Text>
        </Pressable>
      </View>

      {profileDrawerOpen ? <Pressable style={styles.menuOverlay} onPress={() => setProfileDrawerOpen(false)} /> : null}

      <Animated.View
        style={[
          styles.profileDrawer,
          {
            transform: [{ translateX: slideDrawer }],
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Profile Drawer Header */}
        <View style={styles.profileDrawerHeader}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.profileDrawerAvatar} />
          ) : (
            <View style={[styles.profileDrawerAvatar, { backgroundColor: theme.chipBg }]}>
              <Image source={require('./assets/profielicon.png')} style={{ width: 24, height: 24 }} />
            </View>
          )}
          <View style={styles.profileDrawerInfo}>
            {profile?.full_name && (
              <Text style={[styles.profileDrawerName, { color: theme.text }]}>{profile.full_name}</Text>
            )}
            {profile?.email && (
              <Text style={[styles.profileDrawerEmail, { color: theme.subText }]} numberOfLines={1}>{profile.email}</Text>
            )}
          </View>
        </View>

        <View style={[styles.profileDrawerDivider, { backgroundColor: theme.border }]} />

        <Pressable
          style={[styles.profileDrawerMenuItem, styles.profileDrawerLogoutButton]}
          onPress={async () => {
            setProfileDrawerOpen(false);
            await supabase.auth.signOut();
          }}
        >
          <Text style={[styles.profileDrawerMenuItemText, { color: theme.accent }]}>Uitloggen</Text>
        </Pressable>
      </Animated.View>

      {/* Friend Modal */}
      {friendModalVisible && (
        <>
          <Pressable
            style={styles.menuOverlay}
            onPress={() => setFriendModalVisible(false)}
          />
          <View style={[styles.inviteIdModal, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.inviteIdModalTitle, { color: theme.text }]}>Voeg vriend toe</Text>
            
            {/* Your ID Section */}
            <View style={[styles.inviteIdModalContent, { backgroundColor: theme.bg }]}>
              <Text style={[styles.inviteIdLabel, { color: theme.subText }]}>Jouw ID:</Text>
              <Text style={[styles.inviteIdDisplay, { color: theme.accent }]}>
                {profile?.id?.substring(0, 6).toUpperCase()}
              </Text>
            </View>

            {idCopyMessage && (
              <Text style={[styles.inviteIdCopyMessage, { color: theme.accent }]}>
                {idCopyMessage}
              </Text>
            )}

            <Pressable
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              onPress={copyIDToClipboard}
            >
              <Text style={styles.primaryButtonText}>Kopieer mijn ID</Text>
            </Pressable>

            {/* Friend Search Section */}
            <Text style={[styles.inviteIdModalSectionTitle, { color: theme.text, marginTop: 20 }]}>
              Voeg vriend toe
            </Text>

            <TextInput
              value={friendSearchInput}
              onChangeText={setFriendSearchInput}
              placeholder="Voer vriend-ID in"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
              placeholderTextColor={theme.subText}
              editable={!friendSearching}
            />

            {friendSearchMessage && (
              <Text style={[
                styles.messageText,
                { color: friendSearchMessage.includes('niet gevonden') || friendSearchMessage.includes('al vrienden') ? theme.accent : theme.accent }
              ]}>
                {friendSearchMessage}
              </Text>
            )}

            <Pressable
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              onPress={addFriendByID}
              disabled={friendSearching}
            >
              <Text style={styles.primaryButtonText}>{friendSearching ? 'Zoeken...' : 'Voeg toe'}</Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => setFriendModalVisible(false)}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Sluiten</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function SettingsScreen({ navigation, theme, t, darkMode, setDarkMode, language, setLanguage }) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      <CompactHeader navigation={navigation} theme={theme} title={t.settings} />
      <View style={[styles.settingRow, { borderColor: theme.border, backgroundColor: theme.card }]}> 
        <Text style={[styles.settingLabel, { color: theme.text }]}>{t.darkMode}</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: theme.accent }} />
      </View>

      <View style={[styles.settingRow, { borderColor: theme.border, backgroundColor: theme.card }]}> 
        <Text style={[styles.settingLabel, { color: theme.text }]}>{t.language}</Text>
        <View style={styles.langButtonsWrap}>
          <Pressable
            onPress={() => setLanguage('nl')}
            style={[styles.langButton, language === 'nl' && { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.langButtonText, language === 'nl' && { color: '#fff' }]}>NL</Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguage('en')}
            style={[styles.langButton, language === 'en' && { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.langButtonText, language === 'en' && { color: '#fff' }]}>EN</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SurveyScreen({ navigation, route, theme, t }) {
  const mode = route.params?.mode || 'voorIemand';
  const [step, setStep] = useState(mode === 'voorMij' ? 2 : 1);
  const [wie, setWie] = useState(mode === 'voorMij' ? 'Ikzelf' : '');
  const [hobbySearch, setHobbySearch] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [selectedSubHobby, setSelectedSubHobby] = useState('');
  const [budget, setBudget] = useState(50);

  const filteredHobbies = useMemo(() => {
    const query = hobbySearch.trim().toLowerCase();
    if (!query) return HOBBIES;
    return HOBBIES.filter((h) => h.toLowerCase().includes(query));
  }, [hobbySearch]);

  const firstHobbyWithSubtype = selectedHobbies.find((h) => HOBBY_SUBTYPES[h]);
  const hasSubtypeSelected = !!firstHobbyWithSubtype;

  const totalSteps = hasSubtypeSelected 
    ? (mode === 'voorMij' ? 4 : 5)  // Voor wie (skip if voorMij) | Hobbies | Sub | Budget | Summary
    : (mode === 'voorMij' ? 3 : 4); // Voor wie (skip if voorMij) | Hobbies | Budget | Summary

  const next = () => {
    setStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const back = () => {
    setStep((prev) => Math.max(mode === 'voorMij' ? 2 : 1, prev - 1));
  };

  const toggleHobby = (hobby) => {
    setSelectedHobbies((current) =>
      current.includes(hobby) 
        ? current.filter((item) => item !== hobby) 
        : [...current, hobby]
    );
    // Reset subhobby when hobbies change
    setSelectedSubHobby('');
  };

  const canGoNext = () => {
    if (step === 1) return wie.length > 0;
    if (step === 2) return selectedHobbies.length > 0;
    if (step === 3 && hasSubtypeSelected) return selectedSubHobby.length > 0;
    if (step === 3 && !hasSubtypeSelected) return true; // Budget page, always ok
    if (step === 4 && hasSubtypeSelected) return true; // Budget page with subtype
    return true; // Summary page
  };

  const gaNaarResultaten = () => {
    navigation.navigate('Resultaten', {
      survey: {
        voor_wie: mode === 'voorMij' ? 'Ikzelf' : wie,
        hobbies: selectedHobbies,
        sub_hobby: selectedSubHobby,
        budget,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      <CompactHeader navigation={navigation} theme={theme} title={t?.survey || 'Vragenlijst'} />
      
      <View style={[styles.centeredColumn, styles.stepperTop]}> 
        <View style={styles.stepperDots}>
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === step;
            const isComplete = stepNum < step;
            return (
              <View
                key={index}
                style={[
                  styles.stepperDot,
                  isComplete && { backgroundColor: theme.accent },
                  isActive && { 
                    backgroundColor: theme.accent,
                    borderWidth: 2,
                    borderColor: theme.accent,
                  },
                  !isActive && !isComplete && { 
                    backgroundColor: theme.border,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Step 1: Voor wie? (only if not voorMij) */}
      {step === 1 && mode !== 'voorMij' && (
        <View style={[styles.card, styles.centeredCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.questionTitle, { color: theme.text }]}>Voor wie is het cadeau?</Text>
          <View style={styles.choiceWrap}>
            {WIE_OPTIES.map((item) => {
              const active = item === wie;
              return (
                <Pressable
                  key={item}
                  activeOpacity={0.6}
                  style={[
                    styles.optieChip,
                    { backgroundColor: theme.chipBg, borderColor: theme.border },
                    active && styles.optieChipActief,
                  ]}
                  onPress={() => setWie(item)}
                >
                  <Text style={[styles.optieTekst, { color: theme.text }, active && styles.optieTekstActief]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Step 2 (or 1 if voorMij): Hobbies */}
      {step === (mode === 'voorMij' ? 2 : 2) && (
        <View style={[styles.card, styles.centeredCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.questionTitle, { color: theme.text }]}>Kies interesse(s)</Text>
          <TextInput
            value={hobbySearch}
            onChangeText={setHobbySearch}
            placeholder="Zoek (bijv. knutselen, tech)"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
            placeholderTextColor={theme.subText}
          />

          <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={styles.choiceWrap}>
            {filteredHobbies.map((item) => {
              const active = selectedHobbies.includes(item);
              return (
                <Pressable
                  key={item}
                  activeOpacity={0.6}
                  style={[
                    styles.optieChip,
                    { backgroundColor: theme.chipBg, borderColor: theme.border },
                    active && styles.optieChipActief,
                  ]}
                  onPress={() => toggleHobby(item)}
                >
                  <Text style={[styles.optieTekst, { color: theme.text }, active && styles.optieTekstActief]}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={[styles.subtitle, { color: theme.subText, marginTop: 8 }]}>Geselecteerd: {selectedHobbies.length}</Text>
        </View>
      )}

      {/* Step 3: Sub-hobby (if applicable) */}
      {step === 3 && hasSubtypeSelected && (
        <View style={[styles.card, styles.centeredCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.questionTitle, { color: theme.text }]}>Welke specifieke interesse?</Text>
          <Text style={[styles.subtitle, { color: theme.subText, marginBottom: 12 }]}>{firstHobbyWithSubtype}</Text>
          <View style={styles.choiceWrap}>
            {(HOBBY_SUBTYPES[firstHobbyWithSubtype] || []).map((subitem) => {
              const active = subitem === selectedSubHobby;
              return (
                <Pressable
                  key={subitem}
                  activeOpacity={0.6}
                  style={[
                    styles.optieChip,
                    { backgroundColor: theme.chipBg, borderColor: theme.border },
                    active && styles.optieChipActief,
                  ]}
                  onPress={() => setSelectedSubHobby(subitem)}
                >
                  <Text style={[styles.optieTekst, { color: theme.text }, active && styles.optieTekstActief]}>{subitem}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Step 3 or 4: Budget */}
      {((step === 3 && !hasSubtypeSelected) || (step === 4 && hasSubtypeSelected)) && (
        <View style={[styles.card, styles.centeredCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.questionTitle, { color: theme.text }]}>Wat is je budget?</Text>
          <Text style={[styles.sliderValue, { color: theme.accent }]}>€{Math.round(budget)}</Text>
          <Slider
            minimumValue={0}
            maximumValue={300}
            step={5}
            value={budget}
            onValueChange={setBudget}
            minimumTrackTintColor={theme.accent}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.accent}
            style={styles.sliderStyle}
          />
          <Text style={[styles.subtitle, { color: theme.subText }]}>Range: {budgetRangeLabel(budget)}</Text>
        </View>
      )}

      {/* Final step: Summary / Review */}
      {step === totalSteps && (
        <View style={[styles.card, styles.centeredCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.questionTitle, { color: theme.text }]}>✓ Controleer je keuzes</Text>
          {mode !== 'voorMij' && <Text style={[styles.summaryText, { color: theme.text }]}>Voor wie: {wie}</Text>}
          <Text style={[styles.summaryText, { color: theme.text }]}>Interesses: {selectedHobbies.join(', ')}</Text>
          {selectedSubHobby && <Text style={[styles.summaryText, { color: theme.text }]}>Specifiek: {selectedSubHobby}</Text>}
          <Text style={[styles.summaryText, { color: theme.text }]}>Budget: {budgetRangeLabel(budget)}</Text>
        </View>
      )}

      <View style={styles.stepActions}>
        <Pressable 
          style={[styles.secondaryStepButton, { borderColor: theme.border }]} 
          onPress={back} 
          disabled={step === (mode === 'voorMij' ? 2 : 1)}
        >
          <Text style={[styles.secondaryStepButtonText, { color: step === (mode === 'voorMij' ? 2 : 1) ? theme.subText : theme.text }]}>← Terug</Text>
        </Pressable>

        {step < totalSteps ? (
          <Pressable
            style={[styles.primaryStepButton, { backgroundColor: canGoNext() ? theme.accent : '#D2AAB1' }]}
            onPress={next}
            disabled={!canGoNext()}
          >
            <Text style={styles.primaryButtonText}>Volgende →</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.primaryStepButton, { backgroundColor: theme.accent }]} onPress={gaNaarResultaten}>
            <Text style={styles.primaryButtonText}>Toon cadeaus 🎁</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function ResultatenScreen({ navigation, route, theme }) {
  const { survey } = route.params;
  const [cadeaus, setCadeaus] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const ophalen = async () => {
      setLaden(true);
      setFout('');

      try {
        const { data, error } = await supabase.from('products').select('*').limit(500);
        if (error) throw error;

        if (!Array.isArray(data) || data.length === 0) {
          setCadeaus([]);
          setLaden(false);
          return;
        }

        // Safe parsing of survey data
        const hobbies = (Array.isArray(survey?.hobbies) ? survey.hobbies : [])
          .filter(h => h != null)
          .map((item) => String(item).toLowerCase().trim())
          .filter((h) => h.length > 0);
        
        const subHobby = survey?.sub_hobby 
          ? String(survey.sub_hobby).toLowerCase().trim() 
          : '';
        
        const budget = Math.max(0, Number(survey?.budget) || 300);

        console.log('Survey params:', { hobbies, subHobby, budget });

        const filtered = data
          .filter((item) => {
            try {
              // Validate item structure
              if (!item || typeof item !== 'object') return false;

              // Get hobby field safely (hoofd category)
              let hobbyField = '';
              if (item.hobby_tag && typeof item.hobby_tag === 'string') {
                hobbyField = item.hobby_tag.toLowerCase().trim();
              } else if (item.category && typeof item.category === 'string') {
                hobbyField = item.category.toLowerCase().trim();
              } else if (item.title && typeof item.title === 'string') {
                hobbyField = item.title.toLowerCase().trim();
              }

              if (!hobbyField) return false;

              // Get tags/title for sub-hobby matching
              let allText = hobbyField;
              if (item.tags && typeof item.tags === 'string') {
                allText += ' ' + item.tags.toLowerCase();
              }
              if (item.title && typeof item.title === 'string') {
                allText += ' ' + item.title.toLowerCase();
              }

              // Check hobby match (main category)
              let hobbyOk = true;
              if (hobbies.length > 0) {
                hobbyOk = hobbies.some((hobby) => hobbyField.includes(hobby));
              }

              // Check sub-hobby match (in tags or title - only if single hobby)
              let subHobbyOk = true;
              if (subHobby && subHobby.length > 0 && hobbies.length === 1) {
                subHobbyOk = allText.includes(subHobby);
              }

              // Check budget match
              let budgetOk = true;
              if (item.price != null) {
                const numPrice = Number(item.price);
                if (Number.isFinite(numPrice)) {
                  budgetOk = numPrice <= budget;
                }
              }

              const result = hobbyOk && subHobbyOk && budgetOk;
              return result;
            } catch (filterError) {
              console.warn('Filter error for item:', item, filterError);
              return false;
            }
          });

        setCadeaus(filtered);
        setCurrentPage(1);
        console.log('Filtered results:', filtered.length, 'from', data.length);
      } catch (error) {
        console.error('Error fetching products:', error);
        setFout(error?.message || 'Kon cadeaus niet ophalen.');
      } finally {
        setLaden(false);
      }
    };

    ophalen();
  }, [survey]);

  const saveWishlist = async (productId) => {
    setFout('');
    setMelding('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFout('Je bent niet ingelogd.');
        return;
      }

      const { error } = await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
      if (error) throw error;

      setMelding('Cadeau opgeslagen in je verlanglijst.');
    } catch (error) {
      if (String(error.message || '').toLowerCase().includes('duplicate')) {
        setMelding('Dit cadeau staat al in je verlanglijst.');
      } else {
        setFout(error.message || 'Opslaan mislukt.');
      }
    }
  };

  const renderItem = ({ item }) => {
    const title = item.title || item.name || 'Onbekend cadeau';
    const description = item.description || item.omschrijving || '';
    const price = item.price;

    return (
      <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <View style={styles.resultCardContent}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
          {description ? <Text style={[styles.cardDescSmall, { color: theme.subText }]} numberOfLines={2}>{description}</Text> : null}
          {price ? <Text style={[styles.cardPrice, { color: theme.accent }]}>Circa: €{price}</Text> : null}

          <View style={styles.resultButtonsRow}>
            <Pressable style={[styles.primaryButtonSmall, { backgroundColor: theme.accent }]} onPress={() => saveWishlist(item.id)}>
              <Text style={styles.primaryButtonText}>💾 Opslaan</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      <CompactHeader navigation={navigation} theme={theme} title="Resultaten" />
      <View style={styles.centeredColumn}>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          {(survey.hobbies || []).join(', ')} {survey.sub_hobby ? `→ ${survey.sub_hobby}` : ''} | {budgetRangeLabel(survey.budget)}
        </Text>
      </View>
      {fout ? <Text style={styles.errorText}>{fout}</Text> : null}
      {melding ? <Text style={styles.successText}>{melding}</Text> : null}

      {laden ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.subText }}>Cadeaus laden...</Text>
        </View>
      ) : (
        <>
          {cadeaus.length > 0 && (() => {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedData = cadeaus.slice(startIndex, startIndex + itemsPerPage);
            const totalPages = Math.ceil(cadeaus.length / itemsPerPage);
            
            return (
              <>
                <FlatList
                  data={paginatedData}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.subText }]}>Geen cadeaus gevonden voor deze selectie.</Text>
          }
                />
                <View style={styles.paginationContainer}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <Pressable
                      key={pageNum}
                      onPress={() => setCurrentPage(pageNum)}
                      style={[
                        styles.pageButton,
                        { backgroundColor: currentPage === pageNum ? theme.accent : theme.card, borderColor: theme.border }
                      ]}
                    >
                      <Text style={[styles.pageButtonText, { color: currentPage === pageNum ? '#fff' : theme.text }]}>
                        {pageNum}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            );
          })()}
        </>
      )}
    </SafeAreaView>
  );
}

function VerlanglijstScreen({ navigation, theme }) {
  const [items, setItems] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');

  const load = async () => {
    setLaden(true);
    setFout('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setItems([]);
        setFout('Je bent niet ingelogd.');
        setLaden(false);
        return;
      }

      const { data, error } = await supabase
        .from('wishlists')
        .select('id, product_id, products(*)')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      setFout(error.message || 'Kon verlanglijst niet laden.');
    } finally {
      setLaden(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const renderItem = ({ item }) => {
    const product = item.products || {};
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <Text style={[styles.cardTitle, { color: theme.text }]}>{product.title || product.name || 'Onbekend cadeau'}</Text>
        <Text style={[styles.cardText, { color: theme.subText }]}>{product.description || product.omschrijving || 'Geen omschrijving beschikbaar.'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      <CompactHeader navigation={navigation} theme={theme} title="Mijn verlanglijst" />
      {fout ? <Text style={styles.errorText}>{fout}</Text> : null}

      {laden ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.subText }}>Verlanglijst laden...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          onRefresh={load}
          refreshing={laden}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.subText }]}>Je verlanglijst is nog leeg.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

function ProfileScreen({ navigation, theme, t }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState({ full_name: '', avatar_url: '', birthday: '' });
  const [friends, setFriends] = useState([]);
  const [userId, setUserId] = useState(null);
  
  // Simple date picker states
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError('Je bent niet ingelogd.');
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Load own profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, birthday')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (profileData) {
          // Probeer lokale avatar te laden
          let avatarUrl = profileData.avatar_url;
          try {
            const localAvatar = await AsyncStorage.getItem(`avatar_${user.id}`);
            if (localAvatar) {
              avatarUrl = localAvatar;
            }
          } catch (e) {
            // Fallback to database avatar
          }
          
          setProfile({
            ...profileData,
            avatar_url: avatarUrl,
          });
          
          // Initialize date picker states
          if (profileData.birthday) {
            setYear(profileData.birthday.substring(0, 4));
            setMonth(profileData.birthday.substring(5, 7));
            setDay(profileData.birthday.substring(8, 10));
          }
        }

        // Load friends
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('friend_id, profiles!friends_friend_id_fkey(full_name, avatar_url, birthday)')
          .eq('user_id', user.id);

        if (friendsError) throw friendsError;
        setFriends(friendsData || []);
      } catch (profileError) {
        setError(profileError.message || 'Profiel kon niet worden geladen.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Sync profile changes when ProfileScreen closes
  useFocusEffect(
    useCallback(() => {
      const reloadProfile = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData) {
          let avatarUrl = profileData.avatar_url;
          try {
            const localAvatar = await AsyncStorage.getItem(`avatar_${user.id}`);
            if (localAvatar) {
              avatarUrl = localAvatar;
            }
          } catch (e) {
            // Fallback to database avatar
          }
          setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
        }
      };

      reloadProfile();
    }, [])
  );

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Build birthday from year, month, day
      const birthday = year && month && day ? `${year}-${month}-${day}` : null;
      
      const { error: saveError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: profile.full_name ? profile.full_name.trim() : null,
        avatar_url: profile.avatar_url ? profile.avatar_url.trim() : null,
        birthday,
      });

      if (saveError) throw saveError;
      setSuccess('✓ Profiel opgeslagen!');
    } catch (saveError) {
      setError(saveError.message || 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  };

  const choosePhoto = async () => {
    setError('');
    setSuccess('');

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Toegang tot je fotobibliotheek is nodig om een profielfoto te uploaden.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    try {
      const imageUri = result.assets[0].uri;
      
      // Sla lokaal op in AsyncStorage
      await AsyncStorage.setItem(`avatar_${userId}`, imageUri);
      
      // Update state
      setProfile((current) => ({ ...current, avatar_url: imageUri }));
      
      // Sla ook in database op
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: profile.full_name,
        avatar_url: imageUri, // Dit is nu lokaal bestandspad
        birthday: profile.birthday || null,
      });
      
      setSuccess('✓ Foto gewijzigd!');
    } catch (uploadError) {
      setError(uploadError.message || 'Foto uploaden mislukt.');
    }
  };

  const calculateAge = (birthdayStr) => {
    if (!birthdayStr) return null;
    const today = new Date();
    const birthDate = new Date(birthdayStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatBirthdayDisplay = (birthdayStr) => {
    if (!birthdayStr) return 'Niet ingesteld';
    const date = new Date(birthdayStr);
    return date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <CompactHeader navigation={navigation} theme={theme} title="Mijn Profiel" />
      
      <ScrollView contentContainerStyle={styles.profileScrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={[styles.profileHeroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.profilePhotoSection}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.profileLargeAvatar} />
            ) : (
              <View style={[styles.profileLargeAvatar, { backgroundColor: theme.chipBg }]}>
                <Image source={require('./assets/profielicon.png')} style={{ width: 48, height: 48 }} />
              </View>
            )}
          </View>
          
          <Pressable activeOpacity={0.7} style={[styles.primaryButtonSmall, { backgroundColor: theme.accent }]} onPress={choosePhoto}>
            <Text style={styles.primaryButtonText}>📸 Foto wijzigen</Text>
          </Pressable>
        </View>

        {/* Full Name Display */}
        {profile.full_name && (
          <View style={[styles.profileNameCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.profileNameLabel, { color: theme.subText }]}>Naam</Text>
            <Text style={[styles.profileNameDisplay, { color: theme.text }]}>{profile.full_name}</Text>
          </View>
        )}

        {/* Edit Fields */}
        <View style={[styles.profileFormCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formLabel, { color: theme.text }]}>Verjaardag</Text>
          
          <View style={styles.birthdayInputRow}>
            <View style={styles.birthdayInputGroup}>
              <Text style={[styles.birthdayInputLabel, { color: theme.subText }]}>Jaar</Text>
              <TextInput
                value={year}
                onChangeText={setYear}
                placeholder="1995"
                keyboardType="number-pad"
                maxLength={4}
                style={[styles.birthdayInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                placeholderTextColor={theme.subText}
              />
            </View>
            
            <View style={styles.birthdayInputGroup}>
              <Text style={[styles.birthdayInputLabel, { color: theme.subText }]}>Maand</Text>
              <TextInput
                value={month}
                onChangeText={setMonth}
                placeholder="01"
                keyboardType="number-pad"
                maxLength={2}
                style={[styles.birthdayInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                placeholderTextColor={theme.subText}
              />
            </View>
            
            <View style={styles.birthdayInputGroup}>
              <Text style={[styles.birthdayInputLabel, { color: theme.subText }]}>Dag</Text>
              <TextInput
                value={day}
                onChangeText={setDay}
                placeholder="01"
                keyboardType="number-pad"
                maxLength={2}
                style={[styles.birthdayInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                placeholderTextColor={theme.subText}
              />
            </View>
          </View>
          
          {year && month && day && (
            <Text style={[styles.subtitle, { color: theme.accent, marginTop: 12 }]}>
              {formatBirthdayDisplay(`${year}-${month}-${day}`)} (leeftijd: {calculateAge(`${year}-${month}-${day}`)})
            </Text>
          )}
        </View>

        {/* Messages */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        {/* Save Button */}
        <Pressable 
          activeOpacity={0.8}
          style={[styles.primaryButton, { backgroundColor: theme.accent }]} 
          onPress={saveProfile} 
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? '⏳ Opslaan...' : '💾 Profiel opslaan'}</Text>
        </Pressable>

        {/* Friends Section */}
        {friends.length > 0 && (
          <View style={styles.friendsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>👥 Mijn vrienden ({friends.length})</Text>
            
            {friends.map((friend) => {
              const friendProfile = friend.profiles;
              const age = friendProfile?.birthday ? calculateAge(friendProfile.birthday) : null;
              return (
                <View key={friend.friend_id} style={[styles.friendCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.friendContent}>
                    {friendProfile?.avatar_url ? (
                      <Image source={{ uri: friendProfile.avatar_url }} style={styles.friendAvatar} />
                    ) : (
                      <View style={[styles.friendAvatar, { backgroundColor: theme.chipBg }]}>
                        <Image source={require('./assets/profielicon.png')} style={{ width: 16, height: 16 }} />
                      </View>
                    )}
                    <View style={styles.friendInfo}>
                      <Text style={[styles.friendName, { color: theme.text }]}>{friendProfile?.full_name || 'Onbekend'}</Text>
                      {friendProfile?.birthday ? (
                        <Text style={[styles.friendBirthday, { color: theme.subText }]}>
                          🎂 {formatBirthdayDisplay(friendProfile.birthday)} ({age} jaar)
                        </Text>
                      ) : (
                        <Text style={[styles.friendBirthday, { color: theme.subText }]}>Geen verjaardag ingesteld</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {friends.length === 0 && (
          <View style={[styles.emptyFriendsBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyFriendsText, { color: theme.subText }]}>Je hebt nog geen vrienden toegevoegd</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FriendenScreen({ navigation, theme, t }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const loadFriends = async () => {
      setLoading(true);
      setError('');

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError('Je bent niet ingelogd.');
          setLoading(false);
          return;
        }

        // Load friends with their profile information
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('friend_id, profiles!friends_friend_id_fkey(full_name, avatar_url, birthday)')
          .eq('user_id', user.id)
          .order('friend_id', { ascending: true });

        if (friendsError) throw friendsError;
        setFriends(friendsData || []);
      } catch (loadError) {
        setError(loadError.message || 'Vrienden kon niet worden geladen.');
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadFriends = async () => {
        setLoading(true);
        setError('');

        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            setError('Je bent niet ingelogd.');
            setLoading(false);
            return;
          }

          const { data: friendsData, error: friendsError } = await supabase
            .from('friends')
            .select('friend_id, profiles!friends_friend_id_fkey(full_name, avatar_url, birthday)')
            .eq('user_id', user.id)
            .order('friend_id', { ascending: true });

          if (friendsError) throw friendsError;
          setFriends(friendsData || []);
        } catch (loadError) {
          setError(loadError.message || 'Vrienden kon niet worden geladen.');
        } finally {
          setLoading(false);
        }
      };

      loadFriends();
    }, [])
  );

  const calculateAge = (birthdayStr) => {
    if (!birthdayStr) return null;
    const today = new Date();
    const birthDate = new Date(birthdayStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatBirthdayDisplay = (birthdayStr) => {
    if (!birthdayStr) return 'Geen verjaardag ingesteld';
    const date = new Date(birthdayStr);
    return date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <CompactHeader navigation={navigation} theme={theme} title="Mijn vrienden" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <CompactHeader navigation={navigation} theme={theme} title="Mijn vrienden" />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {friends.length > 0 ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => String(item.friend_id)}
          renderItem={({ item }) => {
            const friendProfile = item.profiles;
            const age = friendProfile?.birthday ? calculateAge(friendProfile.birthday) : null;
            
            return (
              <View style={[styles.friendCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.friendContent}>
                  {friendProfile?.avatar_url ? (
                    <Image source={{ uri: friendProfile.avatar_url }} style={styles.friendAvatar} />
                  ) : (
                    <View style={[styles.friendAvatar, { backgroundColor: theme.chipBg }]}>
                      <Image source={require('./assets/profielicon.png')} style={{ width: 16, height: 16 }} />
                    </View>
                  )}
                  <View style={styles.friendInfo}>
                    <Text style={[styles.friendName, { color: theme.text }]}>{friendProfile?.full_name || 'Onbekend'}</Text>
                    <Text style={[styles.friendBirthday, { color: theme.subText }]}>
                      🎂 {formatBirthdayDisplay(friendProfile?.birthday)}
                    </Text>
                    {age !== null && (
                      <Text style={[styles.friendBirthday, { color: theme.subText }]}>
                        {age} jaar oud
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      ) : (
        <View style={[styles.emptyFriendsBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyFriendsText, { color: theme.subText }]}>Je hebt nog geen vrienden</Text>
          <Text style={[styles.emptyFriendsSubText, { color: theme.subText, marginTop: 8 }]}>
            Nodig je vrienden uit met de "Nodig uit" knop
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return <AppShell />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  homeScroll: {
    paddingTop: 16,
    paddingBottom: 80,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  homeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroSection: {
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 24,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    borderLeftWidth: 3,
    paddingLeft: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  featureNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: RUBY_RED,
    marginRight: 12,
    minWidth: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
  },
  cardsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
  },
  cardArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: RUBY_RED,
  },
  sliderStyle: {
    width: '100%',
    height: 40,
    marginVertical: 12,
  },
  friendsSection: {
    marginTop: 28,
    marginBottom: 24,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  friendCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  friendBirthday: {
    fontSize: 12,
  },
  emptyFriendsBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  emptyFriendsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyFriendsSubText: {
    fontSize: 12,
    textAlign: 'center',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    marginBottom: 14,
  },
  compactHeaderBack: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  compactHeaderBackText: {
    fontSize: 20,
    fontWeight: '800',
  },
  compactHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  profileTrigger: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
  },
  profileThumb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 0,
  },
  profileThumbFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredCard: {
    alignItems: 'center',
    textAlign: 'center',
  },
  centeredScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  centeredColumn: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  scrollPad: {
    paddingBottom: 24,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  authCard: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 16,
    marginTop: 36,
    gap: 12,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  input: {
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  profileInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  birthdayInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  birthdayInputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  birthdayInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  birthdayInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  primaryButton: {
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryButtonSmall: {
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 110,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  linkText: {
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 6,
  },
  secondaryButton: {
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#9A0015',
    fontSize: 14,
    marginBottom: 10,
  },
  successText: {
    color: '#0E7A2F',
    fontSize: 14,
    marginBottom: 10,
  },
  heroCard: {
    borderRadius: 15,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 14,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'flex-start',
  },
  homeAction: {
    borderRadius: 15,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 10,
    width: 260,
    alignSelf: 'flex-start',
  },
  homeActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryCard: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 14,
    marginTop: 6,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'flex-start',
  },
  secondaryCardTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryCardSub: {
    marginTop: 3,
    fontSize: 13,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 280,
    borderLeftWidth: 1,
    paddingTop: 70,
    paddingHorizontal: 14,
    zIndex: 1000,
  },
  profileDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 280,
    borderLeftWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 14,
    zIndex: 1000,
  },
  profileDrawerHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  profileDrawerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  profileDrawerInfo: {
    alignItems: 'center',
    width: '100%',
  },
  profileDrawerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileDrawerEmail: {
    fontSize: 12,
    maxWidth: '90%',
  },
  profileDrawerDivider: {
    height: 1,
    marginVertical: 12,
  },
  profileDrawerMenuItem: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  profileDrawerLogoutButton: {
    marginTop: 8,
  },
  profileDrawerMenuItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    justifyContent: 'space-around',
    paddingBottom: 8,
    paddingTop: 8,
  },
  bottomNavButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  bottomNavIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
    resizeMode: 'contain',
  },
  bottomNavLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  settingRow: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  langButtonsWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  langButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B9B9B9',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  langButtonText: {
    color: '#333333',
    fontWeight: '700',
  },
  stepperTop: {
    marginBottom: 20,
  },
  stepperDots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stepperDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    transition: 'all 0.3s ease',
  },
  card: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  profilePhotoSection: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  profilePreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  profilePreviewFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  profilePreviewFallbackText: {
    color: RUBY_RED,
    fontSize: 28,
    fontWeight: '800',
  },
  profileHeroCard: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 20,
    marginBottom: 14,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 14,
  },
  profileLargeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: RUBY_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLargeAvatarText: {
    fontSize: 48,
  },
  profileNameCard: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 16,
    marginBottom: 14,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
  },
  profileNameLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileNameDisplay: {
    fontSize: 24,
    fontWeight: '800',
  },
  profileFormCard: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 16,
    marginBottom: 14,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  profileScrollContent: {
    paddingVertical: 12,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingBottom: 30,
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optieChip: {
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  optieChipActief: {
    backgroundColor: RUBY_RED,
    borderColor: RUBY_RED,
  },
  optieTekst: {
    fontWeight: '600',
  },
  optieTekstActief: {
    color: '#FFFFFF',
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  budgetButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minWidth: '45%',
    alignItems: 'center',
  },
  budgetButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  sliderValue: {
    fontWeight: '800',
    fontSize: 22,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 15,
    marginBottom: 6,
  },
  stepActions: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  secondaryStepButton: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryStepButtonText: {
    fontWeight: '700',
  },
  primaryStepButton: {
    flex: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 12,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  resultCardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDescSmall: {
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 14,
  },
  cardPrice: {
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8,
  },
  cardMeta: {
    fontWeight: '700',
    marginBottom: 8,
  },
  resultButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  secondaryMiniButton: {
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 110,
  },
  secondaryMiniButtonText: {
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 26,
  },
  // Splash Screen Styles
  splashTitle: {
    fontSize: 80,
    marginBottom: 12,
    textAlign: 'center',
  },
  splashAppName: {
    fontSize: 42,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  splashSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    fontWeight: '500',
  },
  splashSpinner: {
    marginVertical: 40,
  },
  splashTipBox: {
    marginTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  splashTip: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: '100%',
    flexWrap: 'wrap',
  },
  pageButton: {
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pageButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  // Invite ID Modal Styles
  inviteIdModal: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inviteIdModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  inviteIdModalContent: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteIdLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  inviteIdDisplay: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  inviteIdInstructions: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  inviteIdCopyMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  inviteIdModalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
