import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
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
import { NavigationContainer } from '@react-navigation/native';
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
    survey: 'Cadeau Wizard',
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

const budgetRangeLabel = (value) => {
  if (value <= 25) return '0-25';
  if (value <= 50) return '25-50';
  if (value <= 100) return '50-100';
  if (value <= 250) return '100-250';
  return '250+';
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

function AppShell() {
  const [sessie, setSessie] = useState(null);
  const [initialiseren, setInitialiseren] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('nl');

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

  useEffect(() => {
    const ensureProfile = async () => {
      if (!sessie?.user?.id) return;

      const metadata = sessie.user.user_metadata || {};
      await supabase.from('profiles').upsert(
        {
          id: sessie.user.id,
          username: metadata.username || metadata.preferred_username || null,
          full_name: metadata.full_name || metadata.name || metadata.display_name || null,
          avatar_url: metadata.avatar_url || metadata.picture || null,
        },
        { onConflict: 'id' }
      );
    };

    ensureProfile();
  }, [sessie?.user?.id]);

  if (initialiseren) {
    return (
      <SafeAreaView style={[styles.centerBox, { backgroundColor: theme.bg }]}> 
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={{ color: theme.subText }}>Prezzie wordt geladen...</Text>
      </SafeAreaView>
    );
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
        <AuthStack theme={theme} t={t} />
      )}
    </NavigationContainer>
  );
}

function AuthStack({ theme, t }) {
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
        {(props) => <RegisterScreen {...props} theme={theme} t={t} />}
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

function RegisterScreen({ navigation, theme, t }) {
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');

  const registreren = async () => {
    if (!email || !wachtwoord) {
      setFout('Vul je e-mailadres en wachtwoord in.');
      return;
    }

    setBezig(true);
    setFout('');
    setMelding('');

    try {
      const redirectUrl = Linking.createURL('auth/callback');
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: wachtwoord,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      setMelding('Account aangemaakt. Bevestig je e-mail en log daarna in.');
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const slide = useRef(new Animated.Value(-280)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: menuOpen ? 0 : -280,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [menuOpen, slide]);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(data || null);
    };

    loadProfile();
  }, []);

  const uitnodigen = async () => {
    await Share.share({
      message:
        'Ik gebruik Prezzie om cadeau-ideeën te vinden. Doe mee! Link: https://jqheuinyrpgzwrnjwmmf.supabase.co',
      title: 'Nodig uit voor Prezzie',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      <ScrollView contentContainerStyle={styles.homeScroll}>
        <View style={styles.homeTopRow}>
          <View />
          <Pressable onPress={() => setMenuOpen(true)} style={styles.profileTrigger}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.profileThumb} />
            ) : (
              <View style={[styles.profileThumbFallback, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <Text style={{ color: theme.accent, fontWeight: '800' }}>P</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.appTitle, { color: theme.accent }]}>{t.homeTitle}</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>{t.homeSub}</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Survey', { mode: 'voorIemand' })}
          style={[styles.homeAction, { backgroundColor: theme.accent }]}
        >
          <Text style={styles.homeActionText}>{t.findForSomeone}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Survey', { mode: 'voorMij' })}
          style={[styles.homeAction, { backgroundColor: theme.card, borderColor: theme.accent, borderWidth: 1 }]}
        >
          <Text style={[styles.homeActionText, { color: theme.accent }]}>{t.findForMe}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Verlanglijst')}
          style={[styles.secondaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Text style={[styles.secondaryCardTitle, { color: theme.text }]}>{t.wishlist}</Text>
          <Text style={[styles.secondaryCardSub, { color: theme.subText }]}>Bekijk opgeslagen cadeaus</Text>
        </Pressable>
      </ScrollView>

      {menuOpen ? <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)} /> : null}

      <Animated.View
        style={[
          styles.sideMenu,
          {
            transform: [{ translateX: slide }],
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.sideMenuTitle, { color: theme.text }]}>Menu</Text>

        <Pressable
          style={styles.sideMenuItem}
          onPress={() => {
            setMenuOpen(false);
            navigation.navigate('Instellingen');
          }}
        >
          <Text style={[styles.sideMenuItemText, { color: theme.text }]}>{t.settings}</Text>
        </Pressable>

        <Pressable
          style={styles.sideMenuItem}
          onPress={() => {
            setMenuOpen(false);
            uitnodigen();
          }}
        >
          <Text style={[styles.sideMenuItemText, { color: theme.text }]}>{t.invite}</Text>
        </Pressable>

        <Pressable
          style={styles.sideMenuItem}
          onPress={() => {
            setMenuOpen(false);
            navigation.navigate('Survey', { mode: 'voorIemand' });
          }}
        >
          <Text style={[styles.sideMenuItemText, { color: theme.text }]}>{t.findForSomeone}</Text>
        </Pressable>

        <Pressable
          style={styles.sideMenuItem}
          onPress={() => {
            setMenuOpen(false);
            navigation.navigate('Survey', { mode: 'voorMij' });
          }}
        >
          <Text style={[styles.sideMenuItemText, { color: theme.text }]}>{t.findForMe}</Text>
        </Pressable>

        <Pressable
          style={styles.sideMenuItem}
          onPress={() => {
            setMenuOpen(false);
            navigation.navigate('Profiel');
          }}
        >
          <Text style={[styles.sideMenuItemText, { color: theme.text }]}>{t.profile}</Text>
        </Pressable>
      </Animated.View>
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
  const [step, setStep] = useState(1);
  const [wie, setWie] = useState(mode === 'voorMij' ? 'Ikzelf' : '');
  const [hobbySearch, setHobbySearch] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [budget, setBudget] = useState(60);

  const filteredHobbies = useMemo(() => {
    const query = hobbySearch.trim().toLowerCase();
    if (!query) return HOBBIES;
    return HOBBIES.filter((h) => h.toLowerCase().includes(query));
  }, [hobbySearch]);

  const next = () => setStep((prev) => Math.min(4, prev + 1));
  const back = () => setStep((prev) => Math.max(1, prev - 1));

  const toggleHobby = (hobby) => {
    setSelectedHobbies((current) =>
      current.includes(hobby) ? current.filter((item) => item !== hobby) : [...current, hobby]
    );
  };

  const canGoNext =
    (step === 1 && (wie || mode === 'voorMij')) ||
    (step === 2 && selectedHobbies.length > 0) ||
    step === 3 ||
    step === 4;

  const gaNaarResultaten = () => {
    navigation.navigate('Resultaten', {
      survey: {
        voor_wie: mode === 'voorMij' ? 'Ikzelf' : wie,
        hobbies: selectedHobbies,
        budget,
        price_range: budgetRangeLabel(budget),
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      <CompactHeader navigation={navigation} theme={theme} title={t?.survey || 'Cadeau Wizard'} />
      <View style={[styles.centeredColumn, styles.stepperTop]}> 
        <Text style={[styles.subtitle, { color: theme.subText }]}>Stap {step} van 4</Text>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}> 
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%`, backgroundColor: theme.accent }]} />
        </View>
      </View>

      {step === 1 ? (
        <View style={[styles.card, styles.centeredCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.questionTitle, { color: theme.text }]}>Voor wie is het cadeau?</Text>
          {mode === 'voorMij' ? (
            <View style={[styles.optieChip, styles.optieChipActief]}>
              <Text style={[styles.optieTekst, styles.optieTekstActief]}>Ikzelf</Text>
            </View>
          ) : (
            <View style={styles.choiceWrap}>
              {WIE_OPTIES.map((item) => {
                const active = item === wie;
                return (
                  <Pressable
                    key={item}
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
          )}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, styles.centeredCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.questionTitle, { color: theme.text }]}>Kies een hobby</Text>
          <TextInput
            value={hobbySearch}
            onChangeText={setHobbySearch}
            placeholder="Zoek hobby (bijv. alcohol, basketballen)"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
            placeholderTextColor={theme.subText}
          />

          <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={styles.choiceWrap}>
            {filteredHobbies.map((item) => {
              const active = selectedHobbies.includes(item);
              return (
                <Pressable
                  key={item}
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
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, styles.centeredCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.questionTitle, { color: theme.text }]}>Budget</Text>
          <Text style={[styles.sliderValue, { color: theme.accent }]}>EUR {Math.round(budget)}</Text>
          <Slider
            minimumValue={0}
            maximumValue={300}
            step={5}
            value={budget}
            onValueChange={setBudget}
            minimumTrackTintColor={theme.accent}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.accent}
          />
          <Text style={[styles.subtitle, { color: theme.subText }]}>Range: {budgetRangeLabel(budget)}</Text>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={[styles.card, styles.centeredCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.questionTitle, { color: theme.text }]}>Controleer je keuzes</Text>
          <Text style={[styles.summaryText, { color: theme.text }]}>Voor wie: {mode === 'voorMij' ? 'Ikzelf' : wie}</Text>
          <Text style={[styles.summaryText, { color: theme.text }]}>Hobby's: {selectedHobbies.length ? selectedHobbies.join(', ') : '-'}</Text>
          <Text style={[styles.summaryText, { color: theme.text }]}>Budget: EUR {Math.round(budget)}</Text>
          <Text style={[styles.summaryText, { color: theme.subText }]}>Bronnen: bol.com en AliExpress</Text>
        </View>
      ) : null}

      <View style={styles.stepActions}>
        <Pressable style={[styles.secondaryStepButton, { borderColor: theme.border }]} onPress={back} disabled={step === 1}>
          <Text style={[styles.secondaryStepButtonText, { color: step === 1 ? theme.subText : theme.text }]}>Terug</Text>
        </Pressable>

        {step < 4 ? (
          <Pressable
            style={[styles.primaryStepButton, { backgroundColor: canGoNext ? theme.accent : '#D2AAB1' }]}
            onPress={next}
            disabled={!canGoNext}
          >
            <Text style={styles.primaryButtonText}>Volgende</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.primaryStepButton, { backgroundColor: theme.accent }]} onPress={gaNaarResultaten}>
            <Text style={styles.primaryButtonText}>Toon cadeaus</Text>
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

  useEffect(() => {
    const ophalen = async () => {
      setLaden(true);
      setFout('');

      try {
        const { data, error } = await supabase.from('gifts').select('*').limit(300);
        if (error) throw error;

        const hobbies = Array.isArray(survey?.hobbies) ? survey.hobbies.map((item) => String(item).toLowerCase()) : [];
        const budget = Number(survey?.budget || 0);

        const filtered = (data || []).filter((item) => {
          const source = String(item.source || item.store || item.shop || '').toLowerCase();
          const sourceOk = source.includes('bol') || source.includes('ali');

          const hobbyField = String(
            item.hobby_tag || item.hobby || item.category || item.tags || item.title || item.name || ''
          ).toLowerCase();
          const hobbyOk = hobbies.length ? hobbies.some((hobby) => hobbyField.includes(hobby)) : true;

          const priceRaw = item.price ?? item.prijs ?? null;
          const price = priceRaw === null ? null : Number(priceRaw);
          const budgetOk = Number.isFinite(price) ? price <= budget : true;

          return sourceOk && hobbyOk && budgetOk;
        });

        setCadeaus(filtered);
      } catch (error) {
        setFout(error.message || 'Kon cadeaus niet ophalen.');
      } finally {
        setLaden(false);
      }
    };

    ophalen();
  }, [survey]);

  const saveWishlist = async (giftId) => {
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

      const { error } = await supabase.from('wishlists').insert({ user_id: user.id, gift_id: giftId });
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

  const openShop = async (item) => {
    const url = item.product_url || item.url || item.link;
    if (url) {
      await Linking.openURL(url);
      return;
    }

    const source = String(item.source || item.store || '').toLowerCase();
    const query = encodeURIComponent(item.title || item.name || survey.hobby_tag || 'cadeau');
    const fallback = source.includes('ali')
      ? `https://www.aliexpress.com/wholesale?SearchText=${query}`
      : `https://www.bol.com/nl/nl/s/?searchtext=${query}`;

    await Linking.openURL(fallback);
  };

  const renderItem = ({ item }) => {
    const title = item.title || item.name || 'Onbekend cadeau';
    const description = item.description || item.omschrijving || 'Geen omschrijving beschikbaar.';
    const source = item.source || item.store || item.shop || 'Onbekende bron';
    const price = item.price ?? item.prijs;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.cardText, { color: theme.subText }]}>{description}</Text>
        <Text style={[styles.cardMeta, { color: theme.accent }]}>Bron: {source}</Text>
        {price ? <Text style={[styles.cardText, { color: theme.text }]}>Prijs: EUR {price}</Text> : null}

        <View style={styles.resultButtonsRow}>
          <Pressable style={[styles.primaryButtonSmall, { backgroundColor: theme.accent }]} onPress={() => saveWishlist(item.id)}>
            <Text style={styles.primaryButtonText}>Opslaan</Text>
          </Pressable>
          <Pressable style={[styles.secondaryMiniButton, { borderColor: theme.accent }]} onPress={() => openShop(item)}>
            <Text style={[styles.secondaryMiniButtonText, { color: theme.accent }]}>Open shop</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      <CompactHeader navigation={navigation} theme={theme} title="Resultaten" />
      <View style={styles.centeredColumn}>
        <Text style={[styles.subtitle, { color: theme.subText }]}>Filter: {(survey.hobbies || []).join(', ')} | EUR {Math.round(survey.budget)}</Text>
      </View>
      {fout ? <Text style={styles.errorText}>{fout}</Text> : null}
      {melding ? <Text style={styles.successText}>{melding}</Text> : null}

      {laden ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.subText }}>Cadeaus laden...</Text>
        </View>
      ) : (
        <FlatList
          data={cadeaus}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.subText }]}>Geen bol.com/AliExpress producten gevonden voor deze selectie.</Text>
          }
        />
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
        .select('id, gift_id, gifts(*)')
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
    const gift = item.gifts || {};
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <Text style={[styles.cardTitle, { color: theme.text }]}>{gift.title || gift.name || 'Onbekend cadeau'}</Text>
        <Text style={[styles.cardText, { color: theme.subText }]}>{gift.description || gift.omschrijving || 'Geen omschrijving beschikbaar.'}</Text>
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
  const [profile, setProfile] = useState({ username: '', full_name: '', avatar_url: '' });

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

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (data) setProfile(data);
      } catch (profileError) {
        setError(profileError.message || 'Profiel kon niet worden geladen.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Je bent niet ingelogd.');
        return;
      }

      const { error: saveError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: profile.username.trim() || null,
        full_name: profile.full_name.trim() || null,
        avatar_url: profile.avatar_url.trim() || null,
      });

      if (saveError) throw saveError;

      setSuccess('Profiel opgeslagen.');
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
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Je bent niet ingelogd.');
        return;
      }

      const asset = result.assets[0];
      const fileExt = asset.uri.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          upsert: true,
          contentType: asset.mimeType || 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;

      setProfile((current) => ({ ...current, avatar_url: avatarUrl }));
      setSuccess('Profielfoto geüpload. Vergeet niet op opslaan te drukken.');
    } catch (uploadError) {
      setError(uploadError.message || 'Foto uploaden mislukt.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={RUBY_RED} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CompactHeader navigation={navigation} theme={theme} title="Profiel" />
      <View style={[styles.card, styles.centeredCard, { backgroundColor: '#fff', borderColor: '#ECECEC' }]}> 
        <Text style={styles.questionTitle}>Profiel</Text>

        <View style={styles.profilePhotoSection}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.profilePreview} />
          ) : (
            <View style={[styles.profilePreview, styles.profilePreviewFallback]}>
              <Text style={styles.profilePreviewFallbackText}>+</Text>
            </View>
          )}

          <Pressable style={styles.secondaryMiniButton} onPress={choosePhoto}>
            <Text style={styles.secondaryMiniButtonText}>Foto uploaden</Text>
          </Pressable>
        </View>

        <TextInput
          value={profile.username}
          onChangeText={(value) => setProfile((current) => ({ ...current, username: value }))}
          placeholder="Gebruikersnaam"
          style={styles.input}
          placeholderTextColor="#8A8A8A"
        />

        <TextInput
          value={profile.full_name}
          onChangeText={(value) => setProfile((current) => ({ ...current, full_name: value }))}
          placeholder="Volledige naam"
          style={styles.input}
          placeholderTextColor="#8A8A8A"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={saveProfile} disabled={saving}>
          <Text style={styles.primaryButtonText}>{saving ? 'Opslaan...' : 'Profiel opslaan'}</Text>
        </Pressable>
      </View>
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
    paddingBottom: 24,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  homeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
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
  },
  profileThumb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E8E8E8',
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
  errorText: {
    color: '#9A0015',
    fontSize: 14,
  },
  successText: {
    color: '#0E7A2F',
    fontSize: 14,
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
    width: 280,
    borderRightWidth: 1,
    paddingTop: 70,
    paddingHorizontal: 14,
  },
  sideMenuTitle: {
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 16,
  },
  sideMenuItem: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  sideMenuItemText: {
    fontSize: 16,
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
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 100,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: 8,
    borderRadius: 100,
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
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
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
});
